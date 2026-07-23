# Auditoria técnica — Sprint 1

## Visão geral da versão recebida

O projeto original é um MVP pequeno em Next.js App Router, com uma página cliente e duas rotas de API:

- `POST /api/process-pdf`: envia um PDF em base64 para a Anthropic e extrai os itens;
- `POST /api/normalize`: envia todos os itens extraídos para a Anthropic e agrupa produtos semelhantes;
- `app/page.jsx`: concentra upload, processamento, comparação, ordenação e exportação.

A base é útil e não precisa ser descartada. O principal trabalho é transformá-la de uma demonstração pública em uma aplicação controlada e persistente.

## Achados críticos da versão original

### 1. Consumo público da chave de IA

As rotas de processamento não exigiam autenticação. Qualquer pessoa que descobrisse o endereço poderia enviar PDFs e gerar cobranças na conta da Anthropic.

**Tratamento nesta Sprint:** senha compartilhada opcional, sessão assinada, cookie `HttpOnly`, proteção das duas APIs e limites básicos de uso.

### 2. Ausência de limites e validação de arquivo

O servidor aceitava o arquivo sem validar tamanho, extensão, MIME type ou assinatura `%PDF-`.

**Tratamento nesta Sprint:** limite padrão de 10 MB, validação em cliente e servidor, máximo de 10 PDFs e até 500 itens por comparação.

### 3. Erros internos expostos

A mensagem original devolvia `err.message` diretamente ao navegador, podendo revelar detalhes do provedor ou da infraestrutura.

**Tratamento nesta Sprint:** resposta pública genérica com código de ocorrência e erro completo apenas nos logs do servidor.

### 4. Colisão de fornecedores

Os preços eram indexados pelo nome do fornecedor. Dois PDFs com o mesmo fornecedor, ou nomes vazios/repetidos, poderiam sobrescrever valores.

**Tratamento nesta Sprint:** cada orçamento recebe um ID único, usado em todo o agrupamento e na tabela.

### 5. CSV inconsistente

O cabeçalho utilizava vírgulas enquanto as linhas utilizavam ponto e vírgula. Também não havia escape completo de aspas nem proteção contra fórmulas executáveis pelo Excel.

**Tratamento nesta Sprint:** delimitador único, escape de campos, BOM UTF-8 e neutralização de células iniciadas por caracteres de fórmula.

### 6. Agrupamento potencialmente incorreto

A instrução permitia agrupar produtos parecidos sem proibir explicitamente diferenças de embalagem, bitola, voltagem, medida ou unidade.

**Tratamento nesta Sprint:** prompt reforçado para não combinar especificações ou unidades incompatíveis e para tratar os itens como dados não confiáveis.

### 7. Componente monolítico

A tela principal concentrava aproximadamente 425 linhas e múltiplas responsabilidades.

**Tratamento nesta Sprint:** separação em componentes de cabeçalho, login, upload, resultados e orquestração; cálculos foram movidos para `lib/comparison.js`.

### 8. Configuração desatualizada

O projeto usa Next.js 16 no `package-lock.json`, mas a configuração empregava `experimental.serverComponentsExternalPackages`, formato antigo, e o README ainda citava Next.js 14.

**Tratamento nesta Sprint:** uso de `serverExternalPackages` e documentação revisada.

## Pontos ainda não resolvidos

### Persistência

As comparações continuam apenas na memória do navegador e somem após atualizar a página. Resolver na Sprint Supabase.

### Contas individuais

A senha atual é compartilhada. Ela é adequada para um grupo pequeno, mas não substitui usuários individuais, recuperação de senha, convites e permissões.

### Rate limiting distribuído

O limite atual fica em memória por instância. Em ambiente serverless, ele reduz abuso simples, mas não é uma garantia global. Para produção com mais tráfego, usar Redis/KV ou controle de cotas no banco.

### Auditoria e custos

Ainda não existe registro de tokens, custo estimado, usuário responsável ou quantidade de documentos processados.

### Testes automatizados

O projeto ainda não possui testes unitários, integração ou end-to-end.

### TypeScript

A migração para TypeScript foi adiada para não misturar refatoração estrutural, autenticação e atualização de dependências na mesma entrega. Deve ser feita antes de ampliar o modelo de dados.

## Arquitetura recomendada para a próxima Sprint

```text
Usuário
  ↓ Supabase Auth
Next.js
  ├─ Dashboard
  ├─ Cotações
  ├─ Fornecedores
  └─ API protegida
       ↓
Supabase PostgreSQL + RLS
  ├─ profiles
  ├─ organizations
  ├─ organization_members
  ├─ quotations
  ├─ quotation_files
  ├─ suppliers
  ├─ quotation_items
  ├─ comparison_groups
  └─ ai_usage_events
       ↓
Anthropic API
```

## Ordem recomendada

1. Publicar esta Sprint em uma branch de preview da Vercel.
2. Configurar senha e segredo de sessão.
3. Testar com PDFs reais e validar a qualidade dos agrupamentos.
4. Criar projeto Supabase.
5. Migrar para TypeScript.
6. Implementar Auth e RLS.
7. Persistir cotações, itens e fornecedores.
8. Criar painel de histórico e controle de uso.
9. Somente depois adicionar compartilhamento público de relatórios e planos pagos.

## Validação realizada nesta entrega

- Conferência integral da estrutura recebida.
- Verificação sintática dos módulos JavaScript de servidor com `node --check`.
- Revisão manual dos componentes JSX e caminhos de importação.
- Varredura de segredos e remoção de dependências/builds locais do pacote final.

O build completo não foi executado neste ambiente porque não houve acesso ao registro npm para reinstalar as dependências. Antes de mesclar em `main`, execute `npm ci` e `npm run build` localmente ou confirme o preview deployment da Vercel.
