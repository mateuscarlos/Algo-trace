# Segurança e limitações

## Controles implementados

- Todas as rotas `/api/*` exigem Firebase ID token no cabeçalho Bearer e validam-no no backend com Firebase Admin.
- O proprietário do registro deriva do UID verificado; `userId` enviado pelo browser não é fonte de autorização.
- Consultar, editar ou apagar registro pertencente a outra pessoa retorna 404 para não revelar a existência do registro.
- Respostas da API omitem o UID persistido.
- Entradas da API têm verificações de formato e limites básicos; o JSON existente é validado antes da leitura/escrita.
- Arquivos inválidos geram erro em vez de serem substituídos por dados vazios.
- Escrita do JSON usa arquivo temporário e rename; permissões restritas são solicitadas no filesystem quando suportadas.
- Credenciais de serviço não pertencem ao `.env` versionado, bundle client ou imagem Docker.

## Operação segura

- TLS obrigatório fora de localhost; configurar domínios permitidos no Firebase Authentication.
- Armazenar `GEMINI_API_KEY` como secret de runtime e limitar acesso operacional.
- Proteger `data/traces.json` e backups com permissões/acesso restrito; backups contêm dados privados e UID.
- Usar disco durável e uma única instância/processo. Não escalar horizontalmente compartilhando JSON.
- Código submetido à geração é enviado ao serviço Gemini configurado; informar os usuários conforme a política do produto.
- Não remover Firestore/Functions/Hosting antigos antes de backup, migração validada e rollback definido.

## Limitações conhecidas e pendências

- JSON não provê transações, locking entre processos, replicação, controle de acesso por linha no disco ou recuperação point-in-time.
- Não houve avaliação dos dados reais do Firestore nem verificação das configurações cloud.
- Não houve teste de autenticação com token real, E2E entre contas, build de imagem, deploy ou teste de restore.
- `npm audit` ainda reporta 4 vulnerabilidades altas e 2 moderadas transitivas após correções compatíveis; a remediação completa indicada exigiria upgrade potencialmente incompatível na cadeia Firebase.
- O lint completo ainda tem dois erros preexistentes; o lint focado das alterações passa.
