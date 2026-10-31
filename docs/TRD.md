# Documento técnico — Controle Financeiro Enjoy

## Stack
Frontend HTML/CSS/JavaScript estático, Supabase JS v2.57.0 via CDN fixo, Tesseract.js v5.1.1 via CDN fixo, Vercel Node.js para consultas públicas, Supabase Auth/Postgres para dados privados. Gráficos externos via TradingView na página pública de cotações.

## Rotas
- `/`: HTML com login Supabase, carteira, importação de backup e OCR.
- `/cotacoes.html`: página pública de consultas de mercado.
- `/api/consulta?ticker=BBSE3`: cotação pública individual.
- `/api/sugerir?q=...`: busca pública por nome/ticker.
- `/api/market?tickers=...`: consulta pública em lote, sem informações da carteira.

## Segredos e autenticação
A URL e a chave **publishable** Supabase são intencionalmente visíveis no browser. Não há chave secret/service_role no código atual. Senhas ficam sob Supabase Auth, não em tabela própria. A sessão do SDK permanece acessível ao JavaScript no navegador: **limitação arquitetural residual**; migrar para BFF e cookies HttpOnly se o nível de sensibilidade dos dados/escala exigir.

## Segurança de aplicação
- `vercel.json`: CSP separada entre login/carteira e consultas públicas, cabeçalhos nosniff, frame-options, referrer, permissions policy.
- `security-utils.js`: valida JSON, tipos de campos, assinaturas de imagens e CSV seguro.
- Vercel WAF: regra ativa para GET `/api/*`, 120 requisições/IP/60s (configuração no projeto, fora do repositório).
- CI: `.github/workflows/security-check.yml`; testes Node.js nativos e verificação de sintaxe.
- **Pendente:** proteção contra senhas vazadas do Supabase, captcha/anti-bot de autenticação, SRI/hospedagem local das bibliotecas externas, teste real de isolamento usuário A/B.
