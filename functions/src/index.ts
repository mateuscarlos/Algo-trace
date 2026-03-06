import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();
const tracesCollection = db.collection("traces");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));


// --- Types ---
interface SavedTrace {
    id: string;
    title: string;
    trace: unknown;
    savedAt: string;
    category?: string;
    tags?: string[];
}

// --- Helpers ---

/**
 * Remove recursivamente valores `undefined` de objetos/arrays.
 * Firestore rejeita qualquer campo com valor `undefined`.
 */
function sanitizeForFirestore(obj: unknown): unknown {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (value !== undefined) {
            result[key] = sanitizeForFirestore(value);
        }
    }
    return result;
}

// --- Auth Middleware ---
interface AuthRequest extends express.Request {
    userId?: string;
}

async function verifyAuth(req: AuthRequest, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Token de autenticação não fornecido" });
        return;
    }

    try {
        const token = authHeader.split("Bearer ")[1];
        const decoded = await admin.auth().verifyIdToken(token);
        req.userId = decoded.uid;
        next();
    } catch {
        res.status(401).json({ error: "Token de autenticação inválido" });
    }
}

// --- Audiogeneration Background Task ---
async function generateAndUploadAudio(traceId: string, traceObj: any) {
    if (!traceObj || !Array.isArray(traceObj.steps)) return;

    try {
        const steps = [...traceObj.steps];
        let hasUpdates = false;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY não configurada. Impossível gerar áudio.");
            return;
        }

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (!step.description || step.audioUrl) continue;

            const text = step.description;
            // Generate audio using Gemini 2.5 Flash setup for TTS
            const url = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            
            const reqBody = {
                contents: [{
                    parts: [{ text }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Aoede" // Available Gemini voices: Aoede, Charon, Fenrir, Kore, Puck (Puck/Aoede are good defaults)
                            }
                        }
                    }
                }
            };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reqBody)
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                console.error(`Falha ao gerar aúdio do Gemini para o passo ${i}:`, errBody);
                continue;
            }

            const data = await response.json() as any;
            const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
            
            if (inlineData && inlineData.data) {
                // The data is a base64 encoded string containing the audio bytes
                const fileName = `traces_audio/${traceId}/step_${i}.wav`;
                const file = bucket.file(fileName);
                
                // Save to storage
                await file.save(Buffer.from(inlineData.data, 'base64'), {
                    metadata: { contentType: inlineData.mimeType || "audio/wav" },
                    public: true, // Make public to be readable by the frontend player
                });

                // Get public URL
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                steps[i] = { ...step, audioUrl: publicUrl };
                hasUpdates = true;
            }
        }

        // Update firestore document if anything changed
        if (hasUpdates) {
            await tracesCollection.doc(traceId).update({ "trace.steps": steps });
            console.log(`Audios gerados e anexados para o trace: ${traceId}`);
        }
    } catch (err) {
        console.error(`Erro na background task de gerar aúdio para o trace ${traceId}:`, err);
    }
}

// Apply auth to all /api routes
app.use("/api", verifyAuth);

// --- API Routes ---

// Listar todos os traces do usuário
app.get("/api/traces", async (req: AuthRequest, res) => {
    try {
        const snapshot = await tracesCollection
            .where("userId", "==", req.userId)
            .orderBy("savedAt", "desc")
            .get();
        const traces = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.json(traces);
    } catch (err) {
        console.error("Erro ao listar traces:", err);
        res.status(500).json({ error: "Erro interno" });
    }
});

// Obter um trace por ID (verifica ownership)
app.get("/api/traces/:id", async (req: AuthRequest, res) => {
    const doc = await tracesCollection.doc(req.params.id as string).get();
    if (!doc.exists) {
        res.status(404).json({ error: "Trace não encontrado" });
        return;
    }
    const data = doc.data();
    if (data?.userId !== req.userId) {
        res.status(403).json({ error: "Sem permissão" });
        return;
    }
    res.json({ id: doc.id, ...data });
});

// Salvar um novo trace
app.post("/api/traces", async (req: AuthRequest, res) => {
    const { title, trace, tags, category } = req.body;
    if (!title || !trace) {
        res.status(400).json({ error: "Campos \"title\" e \"trace\" são obrigatórios" });
        return;
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newTrace: Record<string, any> = {
            title: sanitizeForFirestore(title),
            trace: sanitizeForFirestore(trace),
            savedAt: new Date().toISOString(),
            userId: req.userId,
        };
        if (category) newTrace.category = sanitizeForFirestore(category);
        if (tags && tags.length > 0) newTrace.tags = sanitizeForFirestore(tags);

        const docRef = await tracesCollection.add(newTrace);
        res.status(201).json({ id: docRef.id, ...newTrace });

        // Trigger background audio generation
        generateAndUploadAudio(docRef.id, newTrace.trace).catch(console.error);
    } catch (err) {
        console.error("Erro ao salvar trace:", JSON.stringify(err, Object.getOwnPropertyNames(err as object)));
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        res.status(500).json({ error: `Erro interno ao salvar o trace: ${message}` });
    }
});

// Atualizar título/categoria de um trace
app.patch("/api/traces/:id", async (req: AuthRequest, res) => {
    const { title, category, tags } = req.body;
    const docRef = tracesCollection.doc(req.params.id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
        res.status(404).json({ error: "Trace não encontrado" });
        return;
    }
    if (doc.data()?.userId !== req.userId) {
        res.status(403).json({ error: "Sem permissão" });
        return;
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;

    await docRef.update(updates);
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
});

// Excluir um trace
app.delete("/api/traces/:id", async (req: AuthRequest, res) => {
    const docRef = tracesCollection.doc(req.params.id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
        res.status(404).json({ error: "Trace não encontrado" });
        return;
    }
    if (doc.data()?.userId !== req.userId) {
        res.status(403).json({ error: "Sem permissão" });
        return;
    }
    await docRef.delete();
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
  complexity: {        // Análise de complexidade do algoritmo
    time: string;      // Notação Big-O de tempo (ex: "O(n)")
    space: string;     // Notação Big-O de espaço (ex: "O(1)")
    details: string;   // Explicação concisa do porquê dessa complexidade
  };
  tradeoffs: string;   // Explicação dos tradeoffs dessa abordagem versus outras possíveis para este problema (ex: "O tempo é O(n), mas poderia ser O(log n) com busca binária, embora exigisse ordenação anterior...")
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

app.post("/api/generate", async (req, res) => {
    const { code, language } = req.body;
    if (!code || !language) {
        res.status(400).json({ error: "Campos \"code\" e \"language\" são obrigatórios" });
        return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor" });
        return;
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const prompt = `${ALGO_TRACE_PROMPT}\n\nLinguagem: ${language}\n\nCódigo:\n${code}`;
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`[Tentativa ${attempt}/${MAX_RETRIES}] Gerando trace com ${modelName}...`);

        try {
            const apiVersions = ["v1beta", "v1"];
            let text = "";
            let lastError = "";

            for (const apiVersion of apiVersions) {
                const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;

                try {
                    const apiRes = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 65536,
                                responseMimeType: "application/json",
                            },
                        }),
                    });

                    if (!apiRes.ok) {
                        const errBody = await apiRes.json().catch(() => ({})) as Record<string, unknown>;
                        const errMsg = errBody?.error;
                        lastError = `${apiRes.status}: ${JSON.stringify(errMsg || errBody)}`;
                        console.error(`  ${apiVersion} falhou: ${lastError}`);
                        continue;
                    }

                    const data = await apiRes.json() as Record<string, unknown>;
                    const candidates = data?.candidates as Array<Record<string, unknown>> | undefined;
                    const candidate = candidates?.[0];
                    const finishReason = candidate?.finishReason;

                    if (finishReason === "MAX_TOKENS") {
                        console.warn(`  ${apiVersion}: resposta truncada (MAX_TOKENS)`);
                        lastError = "Resposta truncada pelo limite de tokens";
                        continue;
                    }

                    const content = candidate?.content as Record<string, unknown> | undefined;
                    const parts = content?.parts as Array<Record<string, unknown>> | undefined;
                    text = (parts?.[0]?.text as string) || "";
                    if (text) {
                        console.log(`  Sucesso com ${apiVersion}! (finishReason: ${finishReason})`);
                        break;
                    }
                } catch (fetchErr) {
                    lastError = fetchErr instanceof Error ? fetchErr.message : "Erro de rede";
                    console.error(`  ${apiVersion} erro:`, lastError);
                    continue;
                }
            }

            if (!text) {
                if (attempt < MAX_RETRIES) {
                    console.log("  Sem resposta, tentando novamente...");
                    continue;
                }
                res.status(502).json({ error: `A IA não retornou resultado após ${MAX_RETRIES} tentativas. Último erro: ${lastError}` });
                return;
            }

            text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?\s*```\s*$/i, "").trim();

            let trace;
            try {
                trace = JSON.parse(text);
            } catch (parseErr) {
                console.error(`  JSON inválido na tentativa ${attempt}:`, (parseErr as Error).message);
                if (attempt < MAX_RETRIES) {
                    console.log("  Tentando novamente...");
                    continue;
                }
                res.status(422).json({ error: "A IA retornou um JSON malformado após múltiplas tentativas. Tente com um código mais simples." });
                return;
            }

            if (!trace.title || !trace.steps || !Array.isArray(trace.steps)) {
                if (attempt < MAX_RETRIES) {
                    console.log("  JSON válido mas sem campos obrigatórios, tentando novamente...");
                    continue;
                }
                res.status(422).json({ error: "A IA retornou um JSON em formato inválido. Tente novamente." });
                return;
            }

            trace.code = trace.code || code;
            trace.language = trace.language || language;

            console.log(`  ✅ Trace gerado: "${trace.title}" com ${trace.steps.length} passos`);
            res.json(trace);
            return;
        } catch (err) {
            console.error(`  Erro inesperado na tentativa ${attempt}:`, err);
            const message = err instanceof Error ? err.message : "Erro desconhecido";

            if (message.includes("429") || message.includes("quota") || message.includes("rate")) {
                res.status(429).json({ error: "Cota da API Gemini excedida. Aguarde alguns minutos e tente novamente." });
                return;
            }
            if (message.includes("403") || message.includes("permission") || message.includes("API_KEY")) {
                res.status(403).json({ error: "Chave de API inválida ou sem permissão. Verifique sua GEMINI_API_KEY." });
                return;
            }

            if (attempt >= MAX_RETRIES) {
                res.status(500).json({ error: `Falha ao gerar trace: ${message}` });
                return;
            }
        }
    }
});

// Export as Firebase Cloud Function
export const api = functions.https.onRequest(
    {
        region: "southamerica-east1",
        timeoutSeconds: 120,
        memory: "512MiB",
        secrets: ["GEMINI_API_KEY"],
    },
    app
);
