# Esquema do back-end

- **Identidade:** Supabase Auth com e-mail/senha. Aplicação estática utiliza `@supabase/supabase-js`; a chave publishable é pública.
- **investment_profiles:** `user_id` UUID = `auth.users.id`, `display_name`, metadados de data. Cada usuário só lê, cria, altera ou exclui sua linha.
- **investment_positions:** `id` UUID, `user_id`, ticker, nome, categoria, tipo, instituição, quantidade, preço unitário, preço médio de compra, valor, ganho, proventos e observações. Cada usuário só acessa suas linhas.
- **RLS:** ambas as tabelas com RLS ativo; SELECT/DELETE com `USING ((select auth.uid()) = user_id)`; INSERT com `WITH CHECK`; UPDATE com ambos.
- **Storage:** não possui buckets usados pela aplicação; imagens do OCR são processadas localmente.
- **APIs Vercel:** `/api/consulta`, `/api/sugerir`, `/api/market` fornecem apenas dados públicos de mercado e não acessam o Supabase.
- **Admin:** nenhuma rota de administração implementada.

Novas tabelas precisam de RLS e testes de isolamento entre duas contas. Não usar `service_role` no navegador.
