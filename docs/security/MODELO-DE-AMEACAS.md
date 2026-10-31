# Modelo de ameaças — Controle Financeiro Enjoy

## Ativos sensíveis
Contas e sessões Supabase Auth; histórico e valor de posições; quantidade, preço de compra, proventos; nome e e-mail de clientes.

## Atores
- **Visitante:** consulta apenas mercado público e abre formulário de autenticação.
- **Usuário autenticado:** lê/altera apenas a própria carteira e perfil segundo RLS.
- **Administrador do projeto:** configura Vercel, Supabase e GitHub; não há painel administrativo no site.

## Superfícies
HTML público; scripts externos CDN; páginas públicas de cotações; rotas GET de mercado; formulário de login/cadastro/reset; importação JSON e OCR; Supabase Data API.

## Ameaças e controles
- **BOLA/IDOR:** RLS baseada em `auth.uid()` nas duas tabelas. Teste A/B pendente.
- **XSS/supply-chain:** CSP e validações de saída, com risco residual de CDN e sessão JavaScript.
- **Abuso de APIs:** WAF limitando IP e caching de mercados públicos.
- **Uploads e CSV:** limitação JSON, assinatura de imagem local, neutralização de fórmula.
- **Ataques a contas:** requisitos de senha na interface; pendente controles Supabase no servidor e anti-bot.
- **SSRF:** URLs upstream fixas e ticker validado; sem aceitação de URL arbitrária.
- **Segredos:** apenas chave publishable no navegador; proibir `service_role` e senhas em repositório.

## Regras de futuro
Nova rota privada exige autenticação e autorização no servidor; nova tabela exige RLS e políticas completas; nova API pública exige limitação de frequência e validação de entrada. Nunca desabilitar proteção para corrigir falhas funcionais.
