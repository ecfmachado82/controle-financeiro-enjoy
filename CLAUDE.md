# Regras permanentes de segurança — Controle Financeiro Enjoy

1. Nunca publicar no navegador tokens Supabase secret/service_role, credenciais de banco ou tokens privados de terceiros. A chave **publishable** do Supabase é intencionalmente pública, protegida por RLS.
2. Todo dado financeiro pertence ao usuário autenticado; qualquer nova tabela do Supabase deve ter RLS, `USING` e `WITH CHECK` por `auth.uid()`.
3. Nunca aceitar `user_id`, `role` ou permissões vindas do backup como autoridade. Sempre usar a identidade retornada pela sessão.
4. Não interpolar entrada de usuário em SQL; usar cliente Supabase/consultas parametrizadas.
5. Evitar `innerHTML` com dados externos; quando inevitável, aplicar escape estrito para texto e atributo. Nunca permitir JavaScript arbitrário.
6. Preservar CSP e cabeçalhos em `vercel.json`. Scripts novos devem ser locais ou de domínios revisados.
7. APIs públicas recebem validação de entrada, timeout, limite de respostas e rate limit no Vercel Firewall.
8. Nunca registrar senhas, tokens ou posições financeiras em logs. Usar erros genéricos na interface.
9. Validar JSON por esquema; limitar uploads; neutralizar formula injection no CSV; imagens são lidas localmente, sem upload ao Supabase.
10. Executar `node --test test/security.test.cjs` e `node --check` antes de publicar. Não editar carteiras reais sem confirmação.
11. Alterações em autenticação, políticas RLS ou CSP precisam passar em testes de prévia e revisão de segurança.
12. Dados de cotação devem ser identificados por fonte/data e não ser tratados como preço garantido ou rendimento pessoal.

Veja `docs/security/RELATORIO-CORRECOES.md`, `docs/BACKEND-SCHEMA.md` e `docs/TRD.md`.
