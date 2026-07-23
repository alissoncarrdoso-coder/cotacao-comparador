# Comparador de Cotações — Sprint 2

Plataforma Next.js que extrai itens de orçamentos em PDF com a API da Anthropic, compara fornecedores e salva o histórico individual de cada usuário no Supabase.

## Novidades

- Cadastro e login individual por e-mail e senha.
- Confirmação de e-mail.
- Recuperação de senha.
- Histórico automático de comparações.
- Exclusão e reabertura de resultados anteriores.
- Dados separados por usuário com Row Level Security.
- Compatibilidade com Next.js 16 e seu arquivo `proxy.js`.
- Modo de transição: senha compartilhada continua funcionando quando o Supabase não está configurado.

## Instalação

Leia primeiro:

```text
CONFIGURACAO_SUPABASE.md
```

No Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-sprint2.ps1
```

Depois copie `.env.example` para `.env.local` e preencha as variáveis.

## Banco de dados

Execute no SQL Editor do Supabase:

```text
supabase/migrations/202607220001_create_comparisons.sql
```

## Desenvolvimento local

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Publicação

1. Teste na branch `development`.
2. Configure as variáveis do Supabase na Vercel.
3. Faça um novo deployment.
4. Teste cadastro, login, comparação e histórico.
5. Somente depois faça merge para `main`.

## Variáveis principais

```env
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-sonnet-4-6
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
MAX_PDF_SIZE_MB=10
```

As variáveis `APP_ACCESS_PASSWORD` e `APP_SESSION_SECRET` ficam disponíveis somente como fallback, caso o Supabase ainda não esteja configurado.
