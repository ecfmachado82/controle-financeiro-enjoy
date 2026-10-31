# Cotações no BI

## Fontes
- **Ações e FIIs brasileiros**: [brapi](https://brapi.dev/). Para ampliar cobertura, cadastre `BRAPI_TOKEN` como variável **encrypted** no projeto Vercel, ambiente Production, e publique novamente. Não coloque a chave no HTML nem no repositório.
- **Criptomoedas**: endpoint público Binance Spot, par com BRL (ex.: BTCBRL). Outros pares podem não estar disponíveis.
- **CDB, LCI/LCA e Tesouro**: não há cotação automática nessa fase. O painel indica indisponibilidade, sem inventar valores.

## Como funciona
- O endpoint `/api/market?tickers=...` pesquisa até 20 ativos por solicitação, usando funções serverless Vercel e cache intermediário.
- A seção Mercado e rentabilidade carrega quando você entra na conta ou salva seus investimentos; o botão **Atualizar preços** consulta novamente.
- **Variação dia/24h** é a mudança reportada pelo provedor, não o ganho da sua carteira.
- **Resultado total indicativo** = quantidade × cotação atual − quantidade × preço médio de compra + proventos recebidos. Não considera taxas, tributos nem compras/vendas históricas.
- O campo **Valor atual** da posição cadastrado pelo cliente não é substituído automaticamente: isso evita perdas de dados quando a API estiver fora ou atrasada.
- Não se deve tratar cotações gratuitas como dados em tempo real, nem usar o painel como executor de ordens.

## Segurança
- O endpoint recebe somente códigos públicos, sem quantidade ou identificação de conta.
- Nunca coloque chave de serviço Supabase nem chave secreta brapi no navegador.
