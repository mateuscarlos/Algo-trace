# Algo-trace

Aplicação web para criar, importar e explorar visualmente traces passo a passo de algoritmos. A interface é React/TypeScript; o servidor Express autentica usuários com Firebase Authentication, chama Gemini para geração e armazena traces localmente em JSON.

## Estado

A consolidação de autenticação e armazenamento local está implementada na branch `master`, mas ainda não foi migrada ou implantada em produção. Os dados Firestore e o deploy legado devem ser mantidos até concluir backup, migração e conferência.

## Navegação

- [Arquitetura](Architecture)
- [Desenvolvimento local](Development)
- [Armazenamento e migração](Storage-and-Migration)
- [Operação e deploy](Operations)
- [Segurança e limitações](Security)
- [Checklist e trabalho pendente](Roadmap)

## Repositório e URLs

- Repositório: <https://github.com/mateuscarlos/Algo-trace>
- Desenvolvimento web: <http://localhost:5173>
- API local: <http://localhost:3001/api>
- Aplicação Docker local: <http://localhost:3002>
- Health check local: <http://localhost:3002/healthz>
- Firebase project ID referenciado pelo código: `algo-trace`

Não há domínio customizado nem endereço Firebase Hosting ativo confirmado. A branch padrão é `master`; o workflow Firebase legado executa em push para `main`.

## Estado da documentação

O estado detalhado de implementação, evidências de teste, riscos e itens pendentes está em [docs/PROJECT_STATUS.md](https://github.com/mateuscarlos/Algo-trace/blob/master/docs/PROJECT_STATUS.md) no repositório.
