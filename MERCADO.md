# Cotações do Controle Financeiro Enjoy

## Fontes gratuitas atuais

- **Ações e FIIs brasileiros**: Capital Agora (api/ativo e api/sugerir). Dados do **último fechamento disponível** da B3; pode haver atraso e indisponibilidade.
- **Criptomoedas**: Binance Spot, pares em BRL disponíveis (como BTCBRL). Variação móvel de 24h, não variação de pregão.
- **Histórico e gráficos**: TradingView incorporada apenas na página pública de consulta.
- **CDB, LCI/LCA e Tesouro**: sem atualização automática de rentabilidade nesta fase. O preço atual deverá ser informado pelo usuário; não supor taxa.

## Funcionamento
- A página `/cotacoes.html` pesquisa o mercado sem login e apresenta fonte e data de referência.
- A API `/api/market` aceita até 20 códigos por consulta, mas não recebe quantidades ou saldos do usuário.
- A Vercel executa as APIs e aplica WAF com limite de frequência. Dados recebidos de terceiros são informativos.
- A seção da carteira apenas calcula valores indicativos: quantidade × preço cotado e rentabilidade usando preço médio de compra e proventos informados.
- A consulta **não sobrescreve** os registros salvos no Supabase.

## Segurança e precisão
- Os dados da carteira são protegidos por RLS e não são enviados aos provedores de cotações.
- O servidor valida formato e tamanho do código; usa provedores fixos, sem URLs arbitrárias.
- Fontes gratuitas não garantem tempo real nem completude, e não são adequadas à execução automática de ordens.
- Se uma cotação não estiver disponível, o painel mostra indisponibilidade, não inventa o valor.
