# Sprint 2 — Contas individuais e histórico

## Entregas

- Autenticação individual por e-mail e senha com Supabase Auth.
- Cadastro de usuários com confirmação de e-mail compatível.
- Recuperação e atualização de senha.
- Sessões em cookies usando `@supabase/ssr`.
- Proxy do Next.js 16 para validação e renovação da sessão.
- Fallback automático para a senha compartilhada da Sprint 1.
- Proteção das APIs de IA por usuário autenticado.
- Rate limit identificado pelo usuário quando houver login individual.
- Salvamento automático das comparações.
- Tela de histórico com indicadores.
- Abertura e exclusão de registros salvos.
- Row Level Security para separar os dados de cada usuário.
- Migration SQL pronta para executar no Supabase.
- React atualizado para a versão compatível com Next.js 16.

## Modelo de dados desta etapa

A tabela `comparisons` armazena:

- usuário proprietário;
- título;
- quantidade de fornecedores;
- quantidade de itens;
- economia máxima calculada;
- resultado completo da comparação em JSON;
- data de criação.

Os PDFs originais não são armazenados nesta Sprint. Isso reduz custo, exposição de documentos e complexidade. Apenas os dados extraídos e normalizados são salvos.

## Segurança

A Publishable key do Supabase pode ser usada no navegador porque a autorização efetiva é feita pelas políticas RLS. A Secret key não foi utilizada nesta implementação.

Cada política compara `auth.uid()` com `user_id`, impedindo leitura, alteração ou exclusão de registros de outros usuários.

## Próxima Sprint sugerida

- Empresas e equipes.
- Convites de usuários.
- Papéis de administrador e colaborador.
- Cadastro permanente de fornecedores.
- Renomear e pesquisar comparações.
- Controle de consumo de IA por usuário ou empresa.
- Relatórios PDF e Excel.
