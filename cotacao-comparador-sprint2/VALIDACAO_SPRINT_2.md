# Validação realizada

Foram executadas as seguintes verificações no pacote:

- parsing sintático de todos os arquivos `.js` e `.jsx`;
- conferência de todos os imports relativos;
- teste dos cálculos de melhor preço e economia;
- teste da geração do CSV;
- conferência da presença das quatro políticas RLS no SQL;
- conferência da estrutura de rotas do Next.js 16.

## Validação pendente no computador do projeto

O build completo depende da instalação dos novos pacotes do Supabase. Como o ambiente usado para preparar o ZIP não permitiu baixar dependências pelo npm, execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-sprint2.ps1
```

O script instala as dependências e roda `npm run build`. Não envie para `main` caso o build apresente erro.
