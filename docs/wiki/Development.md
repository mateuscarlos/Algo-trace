# Desenvolvimento local

## Requisitos

- Node.js 22+ e npm.
- Projeto Firebase com provedor Google habilitado.
- Chave Gemini para testar a geração.
- Credenciais Google Cloud autorizadas para acessar Firestore, apenas se executar a migração.

## Configurar

Na raiz do repositório:

```sh
cp .env.example .env
npm ci
```

No Windows PowerShell, a cópia pode ser feita com:

```powershell
Copy-Item .env.example .env
```

Preencha o Firebase Web config (`VITE_FIREBASE_*`) e a chave `GEMINI_API_KEY`. Não adicione credenciais de service account a `.env`, ao Git ou à imagem. `FIREBASE_PROJECT_ID` deve corresponder ao projeto cujos ID tokens serão aceitos.

Inicie em dois terminais:

```sh
npm run dev:server
npm run dev
```

Vite atende em `http://localhost:5173` e encaminha `/api` ao Express em `http://localhost:3001`. Autorize o domínio de desenvolvimento nas configurações do Firebase Authentication.

## Comandos

```sh
npm test
npm run lint
npm run build
npm run build:server
```

`npm run lint` completo ainda encontra dois erros preexistentes: declaração não usada em `functions/src/index.ts` e regra `react-refresh/only-export-components` em `src/contexts/AuthContext.tsx`. O lint focado nos arquivos desta consolidação passou. O estado e resultados completos constam em `docs/PROJECT_STATUS.md`.

## Variáveis

| Variável | Uso |
| --- | --- |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID` | Configuração pública do Firebase Web, incorporada ao bundle frontend. |
| `FIREBASE_PROJECT_ID` | Projeto aceito pelo Firebase Admin no backend. |
| `GEMINI_API_KEY` | Chave privada do backend para a API Gemini. |
| `GEMINI_MODEL` | Modelo Gemini; padrão configurado `gemini-2.5-flash`. |
| `DATA_DIR` | Diretório do JSON; padrão `./data`. |
| `PORT` | Porta HTTP; padrão `3001`. |

Alterar valores `VITE_*` após a compilação requer reconstruir o bundle/imagem.
