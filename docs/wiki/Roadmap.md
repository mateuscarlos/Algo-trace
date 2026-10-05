# Checklist e trabalho pendente

## Implementado e verificado localmente

- [x] API Express autenticada por Firebase ID token.
- [x] Isolamento de registros por UID do token, sem confiar em identidade enviada pelo cliente.
- [x] Persistência JSON com validação e substituição atômica.
- [x] Migração repetível Firestore → JSON, mantendo UID e ID e preservando a origem.
- [x] Compose monta `./data` do host para backup e migração alinhados.
- [x] Interface propaga e mostra erros de API.
- [x] Testes direcionados, build frontend e build servidor passaram.
- [x] Lint focado passou; configuração Compose validada.

## Bloqueado por acesso/decisões de ambiente

- [ ] Obter credenciais autorizadas e confirmar o Firebase/Google Cloud project `algo-trace`.
- [ ] Inspecionar schema, contagem e propriedade dos dados Firestore; confirmar se há registros locais sem proprietário.
- [ ] Fazer backups de origem e do JSON legado; resolver manualmente os registros sem UID.
- [ ] Executar migração controlada e reconciliar contagens, IDs, proprietários e amostras.
- [ ] Aprovar destino de produção, responsável operacional, domínio, TLS, secrets e estratégia de backup.
- [ ] Fazer testes E2E com duas contas Firebase e validar ausência de acesso cruzado.
- [ ] Construir e executar a imagem em staging e validar persistência após recriação do container.
- [ ] Criar CI/deploy específico para a API Express num host com armazenamento persistente.
- [ ] Decidir, somente após o período de validação/rollback, o destino de Functions, Hosting, Firestore e workflow legado.

## Qualidade e manutenção

- [ ] Resolver ou justificar os dois erros de lint preexistentes em `functions/src/index.ts` e `src/contexts/AuthContext.tsx`.
- [ ] Revisar vulnerabilidades transitivas restantes, sem upgrades incompatíveis não testados.
- [ ] Automatizar teste HTTP da API com auth Firebase emulador/mock e duas identidades.
- [ ] Adicionar teste automatizado do script de migração com dados simulados, sem credenciais/projeto reais.
- [ ] Definir política e automação de retenção/rotação de backups.

## Ordem segura

Backup → inventário Firestore/JSON → resolução de propriedade → migração em staging → reconciliação → teste multiusuário → deploy persistente → janela de rollback → decisão sobre legado.

**Importante:** a migração real, qualquer deploy e a remoção de recursos antigos ainda não foram executados.
