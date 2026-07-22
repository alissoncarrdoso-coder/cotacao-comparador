# Comparador de Cotações — Sprint 1

Aplicação Next.js para extrair itens de orçamentos em PDF com a API da Anthropic, normalizar produtos equivalentes e comparar preços entre fornecedores.

## O que mudou nesta versão

- Acesso por senha compartilhada opcional, com cookie assinado e `HttpOnly`.
- Proteção das rotas que consomem a API de IA.
- Limites de tentativas, PDFs e itens para reduzir abuso e custos inesperados.
- Validação do tipo, extensão, assinatura e tamanho do PDF.
- Mensagens de erro públicas sem expor detalhes internos do provedor.
- Fornecedores identificados por IDs únicos, inclusive quando possuem nomes iguais.
- Exportação CSV corrigida e protegida contra fórmulas maliciosas no Excel.
- Regras mais rígidas para não comparar embalagens, medidas ou unidades incompatíveis.
- Tela principal dividida em componentes menores.
- Configuração atualizada para Next.js 16.
- Melhorias de acessibilidade e visualização em telas pequenas.

## Limite importante

A hospedagem pode começar no plano gratuito, mas o processamento com a API da Anthropic é cobrado por uso. A senha compartilhada e os limites desta versão ajudam a controlar quem pode gerar consumo.

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Configure:

```env
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6
APP_ACCESS_PASSWORD=uma-senha-forte
APP_SESSION_SECRET=um-segredo-longo-e-aleatorio
MAX_PDF_SIZE_MB=10
```

Para gerar um segredo aleatório no terminal:

```bash
openssl rand -base64 48
```

Se `APP_ACCESS_PASSWORD` não for cadastrada, o aplicativo continuará público. Para compartilhar apenas com pessoas autorizadas, configure a senha na Vercel.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Publicar na Vercel

1. Envie esta versão para a branch `development` no GitHub.
2. No projeto da Vercel, abra **Settings → Environment Variables**.
3. Cadastre todas as variáveis acima.
4. Faça o deploy da branch de teste.
5. Teste login, upload, comparação e exportação antes de mesclar em `main`.

## Estrutura principal

```text
app/
  api/
    auth/login/route.js
    auth/logout/route.js
    normalize/route.js
    process-pdf/route.js
  components/
    app-header.jsx
    comparator-app.jsx
    comparison-results.jsx
    login-form.jsx
    upload-panel.jsx
  layout.jsx
  page.jsx
lib/
  auth.js
  comparison.js
  rate-limit.js
  validation.js
```

## Próxima etapa: contas e histórico

A autenticação desta Sprint é adequada para compartilhar o sistema com poucas pessoas usando a mesma senha. A próxima Sprint deve integrar Supabase para oferecer:

- contas individuais;
- recuperação de senha;
- empresas e equipes;
- histórico de cotações;
- fornecedores e produtos salvos;
- políticas de acesso por usuário com Row Level Security;
- controle de consumo de IA por usuário ou empresa.
