# Operação e deploy

## Endereços conhecidos

| Ambiente | URL |
| --- | --- |
| Frontend Vite local | `http://localhost:5173` |
| API local | `http://localhost:3001/api` |
| Compose local | `http://localhost:3002` |
| Health check local | `http://localhost:3002/healthz` |

O repositório não confirma endereço público, domínio customizado ou Hosting ativo. Verifique Firebase Console/DNS e as configurações do host antes de divulgar uma URL pública.

## Docker Compose

1. Crie e preencha `.env` conforme `.env.example`.
2. Construa e inicie:

   ```sh
   docker compose up --build -d
   ```
3. Confirme o health check em `http://localhost:3002/healthz`.
4. Confirme que `data/traces.json` no host é atualizado e inclua-o em um procedimento de backup seguro (não no Git).

O Compose monta `./data` no container em `/app/data`. O build da imagem ainda não foi executado/validado neste ambiente. Secrets de runtime devem ser injetados pelo ambiente de deploy; não os embuta na imagem ou no repositório. Valores `VITE_*` são incluídos no build frontend e exigem reconstrução ao mudar.

## Deploy legado: atenção

`.github/workflows/firebase-deploy.yml` roda em push para `main` e executa deploy forçado de Firebase Hosting, Functions e Firestore. A branch padrão é `master`. Esse workflow corresponde ao backend legado, não à nova API Express com JSON local.

Não altere branch/workflow para dispará-lo como se fosse deploy do novo serviço. Antes de qualquer publicação, escolher host persistente, preparar secrets, TLS/domínio, backup/restore, health checks e pipeline específico. Não publique a nova aplicação em ambiente serverless com filesystem efêmero.

## Procedimento de publicação recomendado

1. Executar testes, builds e lint direcionado em CI.
2. Construir imagem versionada e testar em staging.
3. Aplicar configurações/secrets sem incluí-los na imagem.
4. Montar disco persistente exclusivo para `data/`, com backup.
5. Validar health check, autenticação, isolamento, CRUD e geração Gemini.
6. Monitorar erros e espaço no disco; testar restauração de backup.
7. Fazer rollout/rollback conforme o host escolhido.

Essas operações ainda não foram feitas para esta arquitetura.
