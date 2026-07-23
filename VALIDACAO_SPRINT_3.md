# Validação da Sprint 3

## Checklist funcional

1. Criar uma comparação com dois PDFs.
2. Confirmar se o indicador informa organização local ou híbrida.
3. Alterar um preço e conferir o recálculo da economia.
4. Alterar descrição, unidade, quantidade e observação.
5. Adicionar um fornecedor manual e preencher preços.
6. Adicionar e remover um item manual.
7. Importar uma nova cotação dentro da comparação aberta.
8. Confirmar que os PDFs antigos não são processados novamente.
9. Clicar em **Salvar alterações**.
10. Atualizar a página e confirmar a permanência das alterações.
11. Abrir o histórico e verificar se o registro atualizado aparece primeiro.
12. Exportar o CSV e conferir quantidade, preços e observações.

## Supabase

Nenhuma migration adicional é necessária. Caso a atualização falhe, confirme que a policy `Users can update own comparisons` continua ativa.
