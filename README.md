# Algo-Trace

Aplicação web para gerar, importar, salvar e visualizar execuções de algoritmos passo a passo. O frontend é uma SPA React; uma API Express valida a autenticação Firebase, gera traces usando a API Gemini e persiste a biblioteca em um arquivo JSON local.

## Funcionalidades

- Geração de traces a partir de código com Gemini.
- Importação e pré-visualização de arquivos JSON no formato `AlgoTrace`.
- Player interativo com navegação por passos, realce de linhas e visualização de estruturas.
- Biblioteca com categorias, edição, visualização e exclusão.
- Login Google via Firebase Authentication.
- Arquivo JSON local particionado por UID Firebase: cada usuário só pode listar, obter, editar ou excluir os próprios registros.
- Importação idempotente de documentos existentes do Firestore para o arquivo local.

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `src/` | SPA React, rotas, componentes, autenticação e cliente da API |
| `src/types/algo-trace.ts` | Tipos do formato AlgoTrace e dos registros salvos |
| `server/index.ts` | API Express, geração Gemini e entrega do frontend compilado |
| `server/auth.ts` | Verificação de Firebase ID tokens e obtenção do UID |
| `server/trace-store.ts` | Persistência local, isolamento por usuário e importação idempotente |
| `scripts/migrate-firestore.ts` | Migração da coleção Firestore `traces` para o JSON local |
| `functions/` e `firebase.json` | Implementação/deploy Firebase anterior; legado enquanto a migração não for conferida |
| `Dockerfile`, `docker-compose.yml` | Execução com volume persistente para o JSON |

## URLs e serviços conhecidos

- Repositório: <https://github.com/mateuscarlos/Algo-trace>
- Clonagem: `https://github.com/mateuscarlos/Algo-trace.git`
- Desenvolvimento Vite: <http://localhost:5173>
- API local: <http://localhost:3001/api>
- Aplicação via Docker Compose: <http://localhost:3002>
- Health check: <http://localhost:3002/healthz>
- Projeto Firebase configurado no repositório: `algo-trace` (`.firebaserc`).

O repositório não informa um domínio customizado nem confirma um endereço Hosting ativo. Há um workflow Firebase histórico ligado à branch `main`; a branch padrão atual é `master`. Não trate um endereço `*.web.app` como ativo sem verificá-lo no Firebase Console. A aplicação containerizada é a implantação pretendida para persistência local durável.

## Estado atual do projeto

A consolidação para autenticação Firebase e persistência JSON local está implementada no código desta branch. Testes, build do frontend, build do servidor e validação da configuração Compose foram executados localmente. A migração real do Firestore, a configuração de produção e o deploy ainda **não** foram executados.

Antes de usar com dados reais, configure o ambiente, faça backup, migre e confira os registros e o isolamento por usuário. Não remova nem desative o deploy Firebase/Firestore antigo até concluir essa validação. O workflow existente é acionado por pushes em `main`, não por `master`; portanto, atualizar a branch padrão não publica automaticamente esta arquitetura.

O lint completo ainda aponta dois problemas preexistentes em `functions/src/index.ts` e `src/contexts/AuthContext.tsx`. A auditoria npm, após atualizações compatíveis, ainda reporta 4 vulnerabilidades altas e 2 moderadas em dependências transitivas; a correção automática restante requer mudança potencialmente incompatível. Detalhes, validações e próximos passos estão em [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## Requisitos

- Node.js 22 ou superior e npm.
- Projeto Firebase com Google como provedor habilitado no Firebase Authentication.
- Uma chave Gemini para usar a geração por IA.
- Para importar dados do Firestore: credenciais locais do Google Cloud autorizadas a ler a coleção `traces`.
- Docker Engine + Docker Compose para execução containerizada.

## Configuração local

1. Crie `.env` a partir de `.env.example` e preencha os valores da aplicação web do Firebase e a chave Gemini. Os valores `VITE_FIREBASE_*` são configuração pública do cliente web; não inclua chave de service account nesse arquivo.
2. Instale as dependências:

   ```sh
   npm ci
   ```

3. Inicie a API em um terminal:

   ```sh
   npm run dev:server
   ```

4. Inicie o frontend em outro:

   ```sh
   npm run dev
   ```

O proxy do Vite encaminha `/api` para `http://localhost:3001`. Configure no Firebase Authentication os domínios autorizados usados pelo frontend local e pelo domínio final.

Variáveis principais:

| Variável | Uso |
| --- | --- |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID` | Inicialização do Firebase Authentication no cliente |
| `FIREBASE_PROJECT_ID` | Projeto cujos Firebase ID tokens o Express aceita |
| `GEMINI_API_KEY` | Chave usada exclusivamente pelo backend para chamar Gemini |
| `GEMINI_MODEL` | Modelo de geração; padrão `gemini-2.5-flash` |
| `DATA_DIR` | Diretório do arquivo de dados; padrão `./data` |
| `PORT` | Porta Express; padrão `3001` |

## Persistência, formato e segurança

Os traces ficam em `DATA_DIR/traces.json`, como um array JSON. Cada item contém `id`, `userId` (UID do Firebase), `title`, `trace`, `savedAt` e, opcionalmente, `category` e `tags`. O UID é guardado no servidor e não é devolvido ao frontend.

Todas as rotas `/api/*` exigem `Authorization: Bearer <Firebase ID token>`. O servidor verifica o token e deriva o proprietário do UID validado; nunca confia em um `userId` enviado pelo cliente. Consultar, editar ou excluir registros de outro usuário retorna `404`, para não revelar se o ID existe.

O arquivo é gravado com substituição atômica e permissões restritas quando o sistema operacional oferece suporte. Erros de leitura ou JSON inválido não são convertidos em biblioteca vazia, para evitar sobrescrever dados corrompidos. Com a configuração padrão, faça cópias de segurança de `data/traces.json`.

Este armazenamento é adequado a uma única instância Express com volume persistente. Não compartilhe o mesmo arquivo entre múltiplos processos/instâncias: JSON não oferece transações ou bloqueio distribuído. O Compose monta `./data` do host em `/app/data`; o filesystem efêmero de funções/serverless não preserva dados. O texto de código fornecido à geração é enviado à API Gemini.

## Migração dos traces do Firestore

O código do Firestore atual armazena os registros na coleção `traces` e grava `userId` em cada documento. O script mantém o ID original e esse UID, não sobrescreve um registro local com o mesmo ID e é seguro para repetir. Ele **não apaga nem altera** documentos do Firestore.

1. Faça backup dos dados Firestore e mantenha `DATA_DIR=./data` para usar a pasta local compartilhada com o Docker Compose.
2. Configure Application Default Credentials com uma identidade que tenha leitura na coleção:

   ```sh
   gcloud auth application-default login
   ```

   Alternativamente, configure `GOOGLE_APPLICATION_CREDENTIALS` apontando para uma service account protegida fora do repositório. Nunca adicione essa credencial ao Git ou à imagem Docker.
3. Configure `FIREBASE_PROJECT_ID` e, se necessário, `DATA_DIR`.
4. Na raiz do projeto, execute a migração no host. Ela grava em `data/traces.json`, a mesma pasta montada pelo Docker Compose:

   ```sh
   npm run migrate:firestore
   ```

5. Confira as contagens exibidas e valide os dados e o acesso com cada usuário antes de desativar o deploy Firestore antigo.

Documentos sem `userId`, IDs repetidos com proprietários diferentes ou JSON local ilegível interrompem a migração, em vez de atribuir registros ao usuário errado ou ignorar dados. Registros locais antigos sem proprietário precisam de uma decisão manual de atribuição. Sem as credenciais Google Cloud do projeto, a migração não pode ser executada nem a existência/quantidade de documentos confirmada.

## Docker Compose

Com `.env` preenchido:

```sh
docker compose up --build -d
```

O container atende na porta `3002` do host. `docker-compose.yml` monta `./data` do host em `/app/data`, de modo que a biblioteca fica visível para backup e para a migração executada no host, e não é apagada ao substituir o container. A pasta `data/` é ignorada pelo Git. As variáveis `VITE_FIREBASE_*` são usadas no build do frontend; mudanças nelas exigem reconstruir a imagem. `FIREBASE_PROJECT_ID` e `GEMINI_API_KEY` são configuração de runtime do servidor.

## Comandos de qualidade

```sh
npm test
npm run lint
npm run build
npm run build:server
```
