# Arquitetura

## Componentes

| Componente | Função |
| --- | --- |
| `src/` | SPA React/TypeScript: login, geração, importação, biblioteca e visualização passo a passo. |
| `src/lib/storage.ts` | Cliente HTTP da API; envia Firebase ID token e propaga erros. |
| `server/index.ts` | Servidor Express: API, validação, geração Gemini, arquivos estáticos e health check. |
| `server/auth.ts` | Middleware que verifica ID token via Firebase Admin e associa o UID validado à requisição. |
| `server/firebase-admin.ts` | Inicialização/seleção da aplicação Firebase Admin para o projeto configurado. |
| `server/trace-store.ts` | Persistência JSON, isolamento por UID e merge idempotente da importação. |
| `scripts/migrate-firestore.ts` | Leitura da coleção Firestore antiga e importação para o armazenamento local. |
| `functions/`, `firebase.json`, `.github/workflows/firebase-deploy.yml` | Infraestrutura de Functions/Firestore anterior, preservada até migração e decisão operacional. |

## Fluxo de autenticação e dados

1. O usuário autentica-se pelo provedor Google no Firebase Authentication no frontend.
2. Para cada chamada `/api/*`, o cliente envia `Authorization: Bearer <Firebase ID token>`.
3. O middleware valida o token usando Firebase Admin; somente o UID retornado pelo Firebase determina o proprietário.
4. Operações no `TraceStore` filtram pelo UID autenticado. A API não devolve o campo `userId` ao browser.
5. O processo Express lê e grava `DATA_DIR/traces.json`. A gravação escreve um arquivo temporário e renomeia-o para substituir o arquivo anterior.

Rotas principais:

| Método | Caminho | Ação |
| --- | --- | --- |
| GET | `/healthz` | Health check sem autenticação. |
| GET | `/api/traces` | Lista os traces do usuário autenticado. |
| GET | `/api/traces/:id` | Obtém um trace próprio; inexistente ou de outro usuário retorna 404. |
| POST | `/api/traces` | Cria um trace para o UID autenticado. |
| PATCH | `/api/traces/:id` | Atualiza metadados do trace próprio. |
| DELETE | `/api/traces/:id` | Exclui um trace próprio. |
| POST | `/api/generate` | Gera conteúdo com Gemini usando configuração privada do servidor. |

## Formato persistido

Cada item de `traces.json` deve ter `id`, `userId`, `title`, `trace` e `savedAt`; `category` e `tags` são opcionais. O arquivo é um array JSON. O UID é mantido no servidor e não deve ser serializado para respostas da API.

## Decisões e fronteiras

- Firebase Authentication permanece para identidade; Firestore deixa de ser o destino pretendido da persistência, após migração validada.
- JSON simplifica a implantação, mas requer disco durável, backups e uma única instância.
- O serviço antigo de Functions/Firestore permanece como rollback e fonte até validar os dados.
- A migração só lê o Firestore; não apaga nem altera documentos remotos.
