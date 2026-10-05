# Armazenamento e migração

## Armazenamento local

O Express grava `DATA_DIR/traces.json`. Com Docker Compose, `./data` do host é montada em `/app/data`; por isso backups e migração podem ocorrer no host e atingir o mesmo arquivo usado pelo container.

O store valida JSON e campos obrigatórios antes de operar. Arquivo corrompido ou registros sem `userId` interrompem as operações: não são convertidos silenciosamente em biblioteca vazia. A escrita local é atômica no limite do filesystem, mas isso não fornece transações nem lock distribuído entre processos.

Use apenas uma instância do servidor com armazenamento durável. Faça backup externo de `data/traces.json`, proteja o acesso ao host e teste a restauração periodicamente. A pasta `data/` é ignorada pelo Git.

## Dados legados

A aplicação anterior usava a coleção Firestore `traces`. O backend legado salvava `userId`; a migração requer esse campo para preservar propriedade. Não foi possível inspecionar os documentos reais porque o ambiente não tem credenciais Google Cloud autorizadas.

Registros que já estejam em JSON local sem proprietário também não podem ser associados automaticamente com segurança. Determine manualmente o UID correto antes de incorporá-los.

## Executar a migração

Faça isso somente após confirmar o projeto, fazer backup da origem e provisionar destino persistente:

1. Configure Application Default Credentials com uma identidade autorizada a ler a coleção:

   ```sh
   gcloud auth application-default login
   ```

   Ou use `GOOGLE_APPLICATION_CREDENTIALS` apontando para credencial protegida fora do repositório.
2. Na raiz do projeto, defina `FIREBASE_PROJECT_ID` e `DATA_DIR=./data`.
3. Execute:

   ```sh
   npm run migrate:firestore
   ```
4. Compare contagens, IDs e proprietários. Faça testes funcionais com cada conta antes de trocar o tráfego.
5. Mantenha o Firestore original e o mecanismo de rollback até uma decisão explícita após a validação.

O importador preserva IDs e UID, pula reimportações quando ID e proprietário coincidem, e falha em colisão de ID com proprietário diferente ou documento malformado. Não apaga nem altera Firestore; reexecutá-lo após a mesma importação não duplica itens existentes.

## Critério de conclusão

- Backup de origem validado.
- Registros elegíveis possuem UID, ID e campos obrigatórios.
- Contagem e amostras conferem no destino.
- Listagem/CRUD são testados com pelo menos duas contas, sem acesso cruzado.
- Recuperação de backup foi testada.
- Firestore legado só é desativado após aprovação explícita e janela de rollback acordada.
