# Sprint 3 — Planilha editável e primeiro estágio híbrido

## Entregue nesta versão

- comparação transformada em tabela editável;
- edição de descrição, unidade, quantidade, observações e preços;
- inclusão e remoção manual de itens;
- inclusão, renomeação e remoção de fornecedores;
- importação incremental de uma nova cotação sem reprocessar os PDFs antigos;
- recálculo automático da economia considerando a quantidade;
- atualização de comparações já existentes no Supabase por `PATCH`;
- histórico ordenado pela data da última atualização;
- normalização local de itens por similaridade textual;
- chamada da IA de normalização somente quando a confiança local for baixa;
- exportação CSV com quantidade e observações;
- Node fixado em `22.x`;
- remoção da cópia duplicada do projeto.

## Banco de dados

Esta entrega não exige nova migration. A tabela `comparisons` já possui:

- `payload jsonb`, que armazena a tabela editada;
- `updated_at`, atualizado sempre que o usuário salva alterações;
- políticas RLS para atualização pelo proprietário.

## Funcionamento híbrido atual

Nesta etapa, a extração inicial dos dados do PDF ainda usa a API Anthropic. Depois da extração:

1. o aplicativo tenta agrupar os produtos localmente;
2. se a confiança local for suficiente, não chama a rota de normalização por IA;
3. se a confiança for baixa, usa a IA somente como apoio;
4. alterações manuais e cálculos posteriores não consomem API;
5. uma nova cotação importada processa somente o novo PDF.

## Próxima etapa do modelo híbrido

- extrair texto de PDFs digitais no navegador;
- interpretar tabelas comuns com regras locais;
- disponibilizar uma tela de revisão antes de comparar;
- usar a API apenas para PDFs escaneados ou estruturas de baixa confiança;
- adicionar OCR opcional para documentos em imagem.
