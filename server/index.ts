import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { requireFirebaseAuth } from './auth.js';
import { TraceStore, type StoredTrace } from './trace-store.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const store = new TraceStore(path.join(DATA_DIR, 'traces.json'));
const distPath = path.join(process.cwd(), 'dist');

app.use(express.json({ limit: '10mb' }));

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

if (fs.existsSync(distPath)) app.use(express.static(distPath));

app.use('/api', requireFirebaseAuth);

function userIdFrom(res: express.Response): string {
  const userId: unknown = res.locals.userId;
  if (typeof userId !== 'string') throw new Error('Authenticated request has no Firebase UID.');
  return userId;
}

function toClientTrace(trace: StoredTrace) {
  return {
    id: trace.id,
    title: trace.title,
    trace: trace.trace,
    savedAt: trace.savedAt,
    ...(trace.category ? { category: trace.category } : {}),
    ...(trace.tags ? { tags: trace.tags } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalText(value: unknown, maxLength: number): boolean {
  return value === undefined || (typeof value === 'string' && value.length <= maxLength);
}

function isTags(value: unknown): value is string[] | undefined {
  return value === undefined
    || (Array.isArray(value)
      && value.length <= 30
      && value.every((tag) => typeof tag === 'string' && tag.length <= 50));
}

app.get('/api/traces', (_req, res) => {
  const traces = store.listForUser(userIdFrom(res));
  res.json(traces.map(toClientTrace));
});

app.get('/api/traces/:id', (req, res) => {
  const trace = store.getForUser(req.params.id, userIdFrom(res));
  if (!trace) {
    res.status(404).json({ error: 'Trace não encontrado' });
    return;
  }
  res.json(toClientTrace(trace));
});

app.post('/api/traces', (req, res) => {
  const body: unknown = req.body;
  if (!isRecord(body)) {
    res.status(400).json({ error: 'Corpo da requisição inválido' });
    return;
  }

  const { title, trace, category, tags } = body;
  if (
    typeof title !== 'string'
    || title.trim().length === 0
    || title.length > 200
    || !isRecord(trace)
    || !isOptionalText(category, 100)
    || !isTags(tags)
  ) {
    res.status(400).json({ error: 'Título, trace, categoria ou tags inválidos' });
    return;
  }

  const savedTrace = store.create(
    userIdFrom(res),
    title.trim(),
    trace,
    typeof category === 'string' ? category.trim() : undefined,
    tags,
  );
  res.status(201).json(toClientTrace(savedTrace));
});

app.patch('/api/traces/:id', (req, res) => {
  const body: unknown = req.body;
  if (
    !isRecord(body)
    || !isOptionalText(body.title, 200)
    || (typeof body.title === 'string' && body.title.trim().length === 0)
    || !isOptionalText(body.category, 100)
  ) {
    res.status(400).json({ error: 'Título ou categoria inválidos' });
    return;
  }

  const updated = store.updateForUser(req.params.id, userIdFrom(res), {
    ...(typeof body.title === 'string' ? { title: body.title.trim() } : {}),
    ...(typeof body.category === 'string' ? { category: body.category.trim() } : {}),
  });
  if (!updated) {
    res.status(404).json({ error: 'Trace não encontrado' });
    return;
  }
  res.json(toClientTrace(updated));
});

app.delete('/api/traces/:id', (req, res) => {
  if (!store.deleteForUser(req.params.id, userIdFrom(res))) {
    res.status(404).json({ error: 'Trace não encontrado' });
    return;
  }
  res.status(204).send();
});

const ALGO_TRACE_PROMPT = `Você é um especialista em algoritmos e estruturas de dados. Dado o código-fonte abaixo, gere um JSON no formato "AlgoTrace" que descreve a execução passo a passo do algoritmo.

O JSON deve conter:
- title: título descritivo do algoritmo
- steps: array de passos, cada um com description em português brasileiro, structures com o estado completo das estruturas relevantes e codeLineHighlight opcional (linha 1-indexed)
- code: código-fonte recebido, sem comentários
- language: linguagem de programação

Estruturas suportadas:
- array: { id, type: "array", label, data, highlights, pointers }
- hash-map: { id, type: "hash-map", label, data }
- variable: { id, type: "variable", label, data }
- linked-list: { id, type: "linked-list", label, data, highlights?, pointers? }
- stack: { id, type: "stack", label, data, highlights? }
- tree: { id, type: "tree", label, data, highlights? }
- matrix: { id, type: "matrix", label, data, highlights? }

Use um input simples e representativo, entre 8 e 20 passos, e retorne somente JSON válido sem blocos Markdown.`;

app.post('/api/generate', async (req, res) => {
  const body: unknown = req.body;
  if (
    !isRecord(body)
    || typeof body.code !== 'string'
    || body.code.trim().length === 0
    || body.code.length > 50000
    || typeof body.language !== 'string'
    || body.language.trim().length === 0
    || body.language.length > 50
  ) {
    res.status(400).json({ error: 'Código ou linguagem inválidos' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Geração por IA não está configurada no servidor' });
    return;
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = `${ALGO_TRACE_PROMPT}\n\nLinguagem: ${body.language}\n\nCódigo:\n${body.code}`;
  let lastError = 'A IA não retornou conteúdo';

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let text = '';
    for (const apiVersion of ['v1beta', 'v1']) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`,
          {
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
          },
        );

        if (!response.ok) {
          const responseBody: unknown = await response.json().catch(() => ({}));
          const message = isRecord(responseBody) && isRecord(responseBody.error)
            && typeof responseBody.error.message === 'string'
            ? responseBody.error.message
            : `HTTP ${response.status}`;
          lastError = `${apiVersion}: ${message}`;
          continue;
        }

        const responseBody: unknown = await response.json();
        if (!isRecord(responseBody) || !Array.isArray(responseBody.candidates)) continue;
        const candidate: unknown = responseBody.candidates[0];
        if (!isRecord(candidate) || candidate.finishReason === 'MAX_TOKENS') {
          lastError = 'A resposta da IA foi truncada';
          continue;
        }
        const content = candidate.content;
        if (!isRecord(content) || !Array.isArray(content.parts)) continue;
        const firstPart: unknown = content.parts[0];
        if (isRecord(firstPart) && typeof firstPart.text === 'string') {
          text = firstPart.text;
          break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Falha de rede ao chamar a IA';
      }
    }

    if (!text) continue;
    const normalizedText = text
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?\s*```\s*$/i, '')
      .trim();

    let generated: unknown;
    try {
      generated = JSON.parse(normalizedText) as unknown;
    } catch {
      lastError = 'A IA retornou JSON inválido';
      continue;
    }

    if (!isRecord(generated) || typeof generated.title !== 'string' || !Array.isArray(generated.steps)) {
      lastError = 'A IA retornou um trace em formato inválido';
      continue;
    }

    res.json({
      ...generated,
      code: typeof generated.code === 'string' ? generated.code : body.code,
      language: typeof generated.language === 'string' ? generated.language : body.language,
    });
    return;
  }

  console.error(`Falha ao gerar trace com ${modelName}: ${lastError}`);
  res.status(502).json({ error: 'Não foi possível gerar o trace. Revise o código e tente novamente.' });
});

if (fs.existsSync(distPath)) {
  app.get('{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  console.error('Erro não tratado na API', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Algo-Trace disponível na porta ${PORT}; dados em ${DATA_DIR}`);
});
