import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'traces.json');

// Garantir que o diretório de dados existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inicializar arquivo se não existir
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Servir frontend estático (produção)
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// --- API Routes ---

interface SavedTrace {
  id: string;
  title: string;
  trace: unknown;
  savedAt: string;
  category?: string;
  tags?: string[];
}

function readTraces(): SavedTrace[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as SavedTrace[];
  } catch {
    return [];
  }
}

function writeTraces(traces: SavedTrace[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(traces, null, 2), 'utf-8');
}

// Listar todos os traces
app.get('/api/traces', (_req, res) => {
  const traces = readTraces();
  res.json(traces);
});

// Obter um trace por ID
app.get('/api/traces/:id', (req, res) => {
  const traces = readTraces();
  const trace = traces.find((t) => t.id === req.params.id);
  if (!trace) {
    res.status(404).json({ error: 'Trace não encontrado' });
    return;
  }
  res.json(trace);
});

// Salvar um novo trace
app.post('/api/traces', (req, res) => {
  const { title, trace, tags, category } = req.body;
  if (!title || !trace) {
    res.status(400).json({ error: 'Campos "title" e "trace" são obrigatórios' });
    return;
  }
  if (typeof title !== 'string' || title.length > 200) {
    res.status(400).json({ error: 'Título inválido ou muito longo (max 200)' });
    return;
  }
  if (category && (typeof category !== 'string' || category.length > 100)) {
    res.status(400).json({ error: 'Categoria inválida ou muito longa (max 100)' });
    return;
  }

  const traces = readTraces();
  const newTrace: SavedTrace = {
    id: randomUUID(),
    title,
    trace,
    savedAt: new Date().toISOString(),
    category: category || undefined,
    tags,
  };
  traces.push(newTrace);
  writeTraces(traces);
  res.status(201).json(newTrace);
});

// Atualizar título/categoria de um trace
app.patch('/api/traces/:id', (req, res) => {
  const { title, category } = req.body;
  if (title !== undefined && (typeof title !== 'string' || title.length > 200)) {
    res.status(400).json({ error: 'Título inválido ou muito longo (max 200)' });
    return;
  }
  if (category !== undefined && (typeof category !== 'string' || category.length > 100)) {
    res.status(400).json({ error: 'Categoria inválida ou muito longa (max 100)' });
    return;
  }

  const traces = readTraces();
  const trace = traces.find((t) => t.id === req.params.id);
  if (!trace) {
    res.status(404).json({ error: 'Trace não encontrado' });
    return;
  }
  if (title !== undefined) trace.title = title;
  if (category !== undefined) trace.category = category;
  writeTraces(traces);
  res.json(trace);
});

// Excluir um trace
app.delete('/api/traces/:id', (req, res) => {
  const traces = readTraces();
  const filtered = traces.filter((t) => t.id !== req.params.id);
  if (filtered.length === traces.length) {
    res.status(404).json({ error: 'Trace não encontrado' });
    return;
  }
  writeTraces(filtered);
  res.status(204).send();
});

// --- Geração via IA ---

const ALGO_TRACE_PROMPT = `Você é um especialista em algoritmos e estruturas de dados. Dado o código-fonte abaixo, gere um JSON no formato "AlgoTrace" que descreve a execução passo a passo do algoritmo.

O JSON deve seguir EXATAMENTE este formato TypeScript:

interface AlgoTrace {
  title: string;       // Título descritivo do algoritmo
  steps: Step[];       // Array de passos da execução
  code: string;        // O código-fonte original (exatamente como recebido)
  language: string;    // A linguagem de programação
}

interface Step {
  description: string;           // Descrição em português do que acontece neste passo
  structures: Structure[];       // Estado das estruturas de dados neste passo
  codeLineHighlight?: number;    // Número da linha de código sendo executada (1-indexed)
}

Os tipos de Structure suportados são:

1. ArrayStructure:
   { id: string, type: "array", label: string, data: (number|string|boolean|null)[], highlights: number[], pointers: Record<string, number> }
   - highlights: índices das posições destacadas
   - pointers: ponteiros nomeados apontando para índices (ex: { "i": 0, "j": 3 })

2. HashMapStructure:
   { id: string, type: "hash-map", label: string, data: Record<string, string|number|boolean> }

3. VariableStructure:
   { id: string, type: "variable", label: string, data: string|number|boolean|null }

4. LinkedListStructure:
   { id: string, type: "linked-list", label: string, data: [{value: string|number, next?: string}, ...], highlights?: number[], pointers?: Record<string, number> }

5. StackStructure:
   { id: string, type: "stack", label: string, data: (string|number|boolean)[], highlights?: number[] }

6. TreeStructure:
   { id: string, type: "tree", label: string, data: ({value: string|number, left?: number|null, right?: number|null}|null)[], highlights?: number[] }
   - Representação em array (nível por nível)

7. MatrixStructure:
   { id: string, type: "matrix", label: string, data: (string|number|boolean|null)[][], highlights?: [number,number][] }

Regras IMPORTANTES:
- Escreva TODAS as descrições (description) em PORTUGUÊS BRASILEIRO
- Cada step deve conter TODAS as estruturas relevantes com seu estado ATUAL (não apenas as que mudaram)
- Use highlights para marcar posições sendo acessadas/comparadas no passo atual
- Use pointers para indicar variáveis de iteração (i, j, left, right, etc.)
- Inclua variáveis auxiliares relevantes como VariableStructure
- O campo code deve conter o código EXATAMENTE como recebido
- Os codeLineHighlight devem corresponder às linhas reais do código
- Gere entre 8 e 20 passos para cobrir a execução com um input de exemplo razoável
- Use um input de exemplo simples e representativo para a execução
- REMOVA todos os comentários do código-fonte antes de incluí-lo no campo "code" do JSON. O código deve conter apenas instruções executáveis, sem comentários
- Retorne APENAS o JSON, sem markdown, sem \`\`\`, sem explicações extras
`;

app.post('/api/generate', async (req, res) => {
  const { code, language } = req.body;
  if (!code || !language) {
    res.status(400).json({ error: 'Campos "code" e "language" são obrigatórios' });
    return;
  }
  if (typeof code !== 'string' || code.length > 50000) {
    res.status(400).json({ error: 'Código inválido ou muito longo (max 50KB)' });
    return;
  }
  if (typeof language !== 'string' || language.length > 50) {
    res.status(400).json({ error: 'Linguagem inválida ou muito longa (max 50)' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor' });
    return;
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = `${ALGO_TRACE_PROMPT}\n\nLinguagem: ${language}\n\nCódigo:\n${code}`;
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[Tentativa ${attempt}/${MAX_RETRIES}] Gerando trace com ${modelName}...`);

    try {
      // Tentar v1beta primeiro (suporta responseMimeType), depois v1
      const apiVersions = ['v1beta', 'v1'];
      let text = '';
      let lastError = '';

      for (const apiVersion of apiVersions) {
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;

        try {
          const apiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 65536,
                responseMimeType: 'application/json',
              },
            }),
          });

          if (!apiRes.ok) {
            const errBody = await apiRes.json().catch(() => ({}));
            lastError = `${apiRes.status}: ${JSON.stringify(errBody?.error?.message || errBody)}`;
            console.error(`  ${apiVersion} falhou: ${lastError}`);
            continue;
          }

          const data = await apiRes.json();
          const candidate = data?.candidates?.[0];
          const finishReason = candidate?.finishReason;

          // Verificar se a resposta foi truncada
          if (finishReason === 'MAX_TOKENS') {
            console.warn(`  ${apiVersion}: resposta truncada (MAX_TOKENS)`);
            lastError = 'Resposta truncada pelo limite de tokens';
            continue;
          }

          text = candidate?.content?.parts?.[0]?.text || '';
          if (text) {
            console.log(`  Sucesso com ${apiVersion}! (finishReason: ${finishReason})`);
            break;
          }
        } catch (fetchErr) {
          lastError = fetchErr instanceof Error ? fetchErr.message : 'Erro de rede';
          console.error(`  ${apiVersion} erro:`, lastError);
          continue;
        }
      }

      if (!text) {
        if (attempt < MAX_RETRIES) {
          console.log(`  Sem resposta, tentando novamente...`);
          continue;
        }
        res.status(502).json({ error: 'A IA não retornou resultado após múltiplas tentativas. Tente novamente mais tarde.' });
        return;
      }

      // Limpar possíveis blocos de markdown (mesmo com responseMimeType, pode vir com ```)
      text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```\s*$/i, '').trim();

      let trace;
      try {
        trace = JSON.parse(text);
      } catch (parseErr) {
        console.error(`  JSON inválido na tentativa ${attempt}:`, (parseErr as Error).message);
        console.error(`  Primeiros 200 chars:`, text.substring(0, 200));
        console.error(`  Últimos 200 chars:`, text.substring(text.length - 200));
        if (attempt < MAX_RETRIES) {
          console.log(`  Tentando novamente...`);
          continue;
        }
        res.status(422).json({ error: 'A IA retornou um JSON malformado após múltiplas tentativas. Tente com um código mais simples.' });
        return;
      }

      // Validação básica
      if (!trace.title || !trace.steps || !Array.isArray(trace.steps)) {
        if (attempt < MAX_RETRIES) {
          console.log(`  JSON válido mas sem campos obrigatórios, tentando novamente...`);
          continue;
        }
        res.status(422).json({ error: 'A IA retornou um JSON em formato inválido. Tente novamente.' });
        return;
      }

      // Garantir que code e language estejam presentes
      trace.code = trace.code || code;
      trace.language = trace.language || language;

      console.log(`  ✅ Trace gerado: "${trace.title}" com ${trace.steps.length} passos`);
      res.json(trace);
      return;

    } catch (err) {
      console.error(`  Erro inesperado na tentativa ${attempt}:`, err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';

      if (message.includes('429') || message.includes('quota') || message.includes('rate')) {
        res.status(429).json({
          error: 'Cota da IA excedida. Aguarde alguns minutos e tente novamente.'
        });
        return;
      }
      if (message.includes('403') || message.includes('permission') || message.includes('API_KEY')) {
        res.status(403).json({
          error: 'Serviço temporariamente indisponível devido a um erro de configuração.'
        });
        return;
      }

      if (attempt >= MAX_RETRIES) {
        res.status(500).json({ error: 'Falha ao gerar trace devido a um erro interno.' });
        return;
      }
    }
  }
});

// SPA fallback — qualquer rota não-API serve o index.html
if (fs.existsSync(distPath)) {
  app.get('{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Algo-Trace API rodando em http://0.0.0.0:${PORT}`);
  console.log(`📁 Dados persistidos em: ${DATA_DIR}`);
});
