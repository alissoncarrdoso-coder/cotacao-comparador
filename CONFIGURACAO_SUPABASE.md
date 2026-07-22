# Configuração do Supabase — Sprint 2

## 1. Criar o projeto

1. Entre no painel do Supabase.
2. Crie um novo projeto.
3. Aguarde a inicialização do banco.

## 2. Criar a tabela de histórico

No Supabase, abra **SQL Editor → New query**.

Copie todo o conteúdo do arquivo:

```text
supabase/migrations/202607220001_create_comparisons.sql
```

Clique em **Run**. O script cria a tabela `comparisons`, o índice e as políticas de Row Level Security.

## 3. Copiar as credenciais públicas

No painel do projeto, abra **Connect** ou **Project Settings → API** e copie:

- Project URL;
- Publishable key (`sb_publishable_...`).

Não use a Secret key nem a antiga `service_role` no navegador ou nas variáveis `NEXT_PUBLIC_*`.

## 4. Configurar autenticação

Abra **Authentication → URL Configuration**.

Configure:

```text
Site URL:
https://cotacao-comparador.vercel.app
```

Adicione em **Redirect URLs**:

```text
http://localhost:3000/**
https://cotacao-comparador.vercel.app/**
```

Para testar deployments Preview, adicione também o padrão correspondente ao domínio Preview exibido pela Vercel. Em produção, prefira o endereço exato.

Em **Authentication → Providers → Email**, mantenha Email habilitado. Você pode escolher se o cadastro precisa de confirmação por e-mail.

## 5. Configurar a Vercel

Abra **Vercel → Project → Settings → Environment Variables** e adicione:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
```

Marque **Production**, **Preview** e **Development** conforme necessário.

Mantenha também:

```env
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-sonnet-4-6
MAX_PDF_SIZE_MB=10
```

Quando as duas variáveis do Supabase existirem, o sistema troca automaticamente a senha compartilhada por login individual.

## 6. Instalar as dependências

Esta versão utiliza Node.js 22. Na raiz do projeto, no PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-sprint2.ps1
```

O script apaga dependências antigas, recria o `package-lock.json`, instala os pacotes e executa o build.

Alternativa manual:

```powershell
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
npm install
npm run build
```

## 7. Testes obrigatórios

1. Criar uma conta.
2. Confirmar o e-mail, caso a confirmação esteja habilitada.
3. Entrar e sair.
4. Recuperar a senha.
5. Comparar dois PDFs.
6. Confirmar a mensagem de salvamento.
7. Abrir **Histórico**.
8. Abrir e excluir uma comparação.
9. Criar uma segunda conta e confirmar que ela não vê o histórico da primeira.

## Solução de problemas

### A página continua pedindo a senha compartilhada

As variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` não chegaram ao deployment. Confira se ambas estão preenchidas e faça um novo deploy sem cache.

### Login funciona, mas o histórico não salva

Execute novamente a migration SQL no Supabase. No navegador, a mensagem normalmente indicará que a tabela `comparisons` não foi encontrada ou que a operação foi bloqueada.

### O link do e-mail abre localhost ou um endereço incorreto

Revise **Authentication → URL Configuration**, o Site URL e a lista de Redirect URLs.

### O npm informa incompatibilidade com Node

Atualize para Node.js 22 antes de instalar as dependências.
