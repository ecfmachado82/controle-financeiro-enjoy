# Relatório de correções — 31/10/2026

Base: auditoria inicial de 31/10/2026, commit `4b56b093`. Código preparado na branch `security-hardening-2026-10-31`.

## Situação por achado

| Achado | Situação | Ações |
|---|---|---|
| SEG-01 — Scripts e XSS | **Parcialmente mitigado** | JS inline separado em `app.js` e `quotes.js`; CSP obrigatória específica por página; fontes externas restritas; `security-utils.js` para validação. Residuais: bibliotecas remotas sem SRI e sessões Supabase em storage do navegador. |
| SEG-02 — Abuso da API | **Mitigado** | Vercel WAF: regra ativa `GET /api/*`, limite por IP 120/60s, retorno de rate limit, validada no painel. Não houve teste de sobrecarga. |
| SEG-03 — Senhas / bots | **Parcial** | Novas senhas e redefinições com mínimo de 10 caracteres na UI; login existente não é bloqueado. **Pendente na conta Supabase:** habilitar proteção contra senhas vazadas e CAPTCHA; política do servidor precisa ser alinhada. |
| SEG-04 — Cabeçalhos | **Mitigado** | `vercel.json` com CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy e COOP. |
| SEG-05 — Importação | **Mitigação parcial** | 1 MB e 200 posições por JSON; validação de tipos, campos, comprimentos e números; ignora duplicatas por ticker+origem; imagens verificadas por assinatura PNG/JPEG/WebP. Nova API de importação validada no servidor ainda não existe. |
| SEG-06 — CSV injection | **Mitigado** | Textos de células potencialmente interpretáveis como fórmula são prefixados para leitura como texto; testes de regressão. |
| SEG-07 — Dependências/testes | **Parcial** | CI GitHub Actions com testes sem dependências externas, sintaxe e detector básico de segredos. SRI/monitoramento de CDN e testes de navegador permanecem pendentes. |
| SEG-08 — Mensagens técnicas | **Mitigado no fluxo principal** | Mensagens genéricas de sincronização, importação OCR e exclusão, sem expor detalhes SQL. |
| SEG-09 — Fonte financeira | **Mitigado** | Documentação alinhada com Capital Agora/Binance; texto de preço alterado para "fechamento informado pelo agregador". |

## Sem alteração de dados

Nenhuma posição de investimento, conta ou senha foi criada, alterada ou excluída durante este conjunto de correções. A migração de RLS já existente permanece intacta.

## Verificações

- Confirmar política CSP/headers nas respostas HTTP da prévia e produção.
- Executar testes de regressão e checagem JS no CI.
- Validar rotas públicas de consulta sem login.
- Realizar teste manual de login, cadastro, reset e OCR real após publicação.
- Testar isolamento entre duas contas de teste com permissão explícita.

## Pendências operacionais

1. Supabase Dashboard → Auth → Security: ativar proteção contra senhas vazadas (se plano suportar) e exigir mínimo de 10 caracteres no servidor.
2. Supabase Dashboard → Auth → Bot and Abuse Protection: criar Turnstile/hCaptcha, configurar site key e segredo com segurança, integrar token de validação no cliente; não ativar parcialmente.
3. Avaliar hospedagem local ou SRI para Supabase JS, Tesseract e TradingView; conferir logs CSP se OCR/gráfico não funcionar.
4. Evoluir autenticação para BFF + cookies HttpOnly se for oferecer serviço público de acompanhamento financeiro a terceiros.
5. Validar custo/limites WAF e alertas de uso, além de revisar credenciais históricas Git.
6. Habilitar branch protection / checks obrigatórios em GitHub antes de crescer.

**Nota:** nenhuma auditoria estática comprova ausência de falhas. Usuário A/B e validações de navegador precisam ocorrer em ambiente controlado.
