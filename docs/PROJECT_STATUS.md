# Estado do projeto Algo-trace

**Última atualização:** 2026-10-05  
**Branch de trabalho:** `master`  
**Repositório:** <https://github.com/mateuscarlos/Algo-trace>

## Resumo executivo

O código desta branch consolida o Algo-trace em uma aplicação React servida por uma API Express. O login Google continua usando Firebase Authentication; a API valida Firebase ID tokens e persiste os traces em `DATA_DIR/traces.json`, isolados por UID. Foi incluído um importador idempotente do Firestore legado que preserva IDs e proprietários sem alterar a origem.

As alterações foram validadas localmente com testes, builds e lint direcionado. Ainda não houve migração com dados reais, deploy, verificação de credenciais/projeto Firebase nem confirmação do endereço público da aplicação. A infraestrutura e o workflow Firebase anteriores foram preservados como rollback/fonte até ser possível verificar a migração.

## O que foi feito

- Reescrita da API Express com autenticação Firebase Admin em todas as rotas `/api/*`.
- Derivação do proprietário exclusivamente do UID do token validado; o servidor não confia em `userId` fornecido pelo cliente.
- CRUD de traces limitado ao usuário autenticado. Tentativas de obter, alterar ou excluir traces de outra conta retornam 404.
- Persistência JSON local com escrita atômica, validação do conteúdo existente e falha explícita para arquivo inválido em vez de sobrescrevê-lo com uma biblioteca vazia.
- Rota de health check `/healthz` e tratamento de erros da API.
- Migração `npm run migrate:firestore`: preserva UID e IDs originais, pula reimportações do mesmo proprietário e interrompe colisões de proprietário ou documentos sem `userId`. Não modifica nem apaga o Firestore.
- Compose configurado para montar `./data` do host em `/app/data`; essa mesma pasta é usada pela migração feita no host.
- Cliente e páginas atualizados para reportar erros HTTP ao usuário.
- `.env.example`, configuração de Docker e documentação da arquitetura, setup e migração.
- Testes de isolamento por usuário, migração idempotente e proteção contra arquivo JSON corrompido.
- Ajustes de configuração para não incluir testes Node nos builds de produção e para executar os testes do servidor com `tsx`.

## Validações realizadas

| Verificação | Resultado |
| --- | --- |
| `npm test` | Passou: 5 testes de tradução e 3 testes do armazenamento. O teste de JSON corrompido registra intencionalmente o erro esperado. |
| `npm run build` | Passou: TypeScript do frontend e build de produção Vite. |
| `npm run build:server` | Passou: compilação TypeScript do servidor. |
| Verificação de tipos de `scripts/migrate-firestore.ts` | Passou com `tsc --noEmit` direcionado. |
| ESLint dos arquivos da alteração | Passou. |
| `npm run lint` completo | Ainda falha em dois itens preexistentes descritos abaixo. |
| `docker compose config --quiet` | Passou; sem `.env`, Compose avisou que as variáveis não configuradas seriam vazias. |
| Build/execução Docker | Não executado. |
| Migração e teste com contas Firebase reais | Não executados. |
| Deploy ou alteração de infraestrutura remota | Não executados. |

Os dois erros do lint completo estão em:

- `functions/src/index.ts`: tipo `SavedTrace` declarado e não utilizado.
- `src/contexts/AuthContext.tsx`: regra `react-refresh/only-export-components`.

Esses arquivos não foram alterados nesta consolidação.

## Auditoria de dependências

Foi executado `npm audit fix` sem `--force`, aplicando atualizações compatíveis. Permaneceram **4 vulnerabilidades altas e 2 moderadas**, transitivas no grafo atual, associadas especialmente às dependências Google/Firebase e ao `uuid`. A recomendação do npm para eliminar todas inclui uma mudança potencialmente incompatível na cadeia Firebase; essa mudança não foi aplicada. Antes de publicar uma implantação, reavaliar o grafo, as versões upstream e a compatibilidade em uma mudança separada.

## O que falta fazer

### Antes da migração

1. Obter acesso autorizado ao projeto Firebase/Google Cloud `algo-trace` e confirmar que ele é o projeto correto.
2. Confirmar a coleção Firestore, contagens, formato dos documentos e presença de `userId` em todos os registros.
3. Fazer backup verificável da origem e de qualquer arquivo local que já contenha dados.
4. Configurar os valores reais do cliente Firebase e do backend local em `.env`; guardar ADC/service account fora do repositório.
5. Inspecionar dados locais antigos sem `userId` e decidir manualmente a atribuição. O sistema não consegue associá-los com segurança por conta própria.
6. Executar a migração primeiro em ambiente controlado. Conferir contagens, IDs, proprietários e amostras antes de permitir o uso normal.
7. Testar login e CRUD com pelo menos duas contas Firebase, verificando o isolamento de ponta a ponta.

### Antes do deploy

1. Escolher e provisionar um host com volume persistente e uma única instância Express. O JSON não oferece transações ou locking entre processos.
2. Configurar DNS/domínios autorizados Firebase, HTTPS, secrets de runtime e processo de backup/restore de `data/traces.json`.
3. Construir e executar a imagem Docker em staging; confirmar health check, volume, reinício, autenticação e geração Gemini.
4. Definir o fluxo de deploy. O workflow em `.github/workflows/firebase-deploy.yml` é acionado em `main` e publica Hosting/Functions/Firestore; o padrão do repositório é `master`. Não é um deploy para o novo servidor JSON e não deve ser disparado inadvertidamente como publicação desta arquitetura.
5. Reavaliar vulnerabilidades transitivas e determinar se é possível corrigir sem upgrade incompatível.
6. Corrigir os dois erros de lint preexistentes, ou documentar uma exceção intencional com o responsável.
7. Só depois da conferência e do período de rollback decidir se desativar Functions, Hosting, workflow e regras/indexes Firestore.

## Limites e riscos conhecidos

- A persistência JSON é apropriada apenas para uma instância do servidor com volume persistente. Não escalar com várias réplicas/processos compartilhando o arquivo.
- O Firestore ainda pode ser fonte de dados ativa no deploy antigo. A alteração local não troca a infraestrutura remota.
- O estado de dados e credenciais do projeto cloud não foi inspecionado; nenhuma quantidade de registros é afirmada.
- Um domínio público/Hosting ativo não foi confirmado. Os únicos endereços confirmados no código são os locais documentados no README.
- Os dados do JSON contêm UID e conteúdo enviado pelo usuário; proteger permissões do host, backups e acesso operacional.
- A geração envia o código fornecido pelo usuário ao endpoint da API Gemini configurada.

## Referências

- Configuração e visão geral: [`README.md`](../README.md)
- Procedimento de migração: [`README.md`](../README.md#migração-dos-traces-do-firestore)
- Fonte da API: `server/index.ts`
- Armazenamento: `server/trace-store.ts`
- Migração: `scripts/migrate-firestore.ts`
- Deploy Firebase legado: `.github/workflows/firebase-deploy.yml`
