# Como aplicar a Sprint 2 no repositório correto

## 1. Confirmar a pasta

Abra o PowerShell dentro do repositório e execute:

```powershell
git rev-parse --show-toplevel
git remote -v
git branch --show-current
```

O caminho deve terminar em `cotacao-comparador` e a branch deve ser `development`.

## 2. Criar backup

```powershell
git switch development
git pull origin development
git branch backup-antes-sprint2
```

## 3. Copiar os arquivos

Descompacte `cotacao-comparador-sprint2.zip`.

Copie o conteúdo de dentro da pasta `cotacao-comparador-sprint2` para a raiz do repositório. Preserve a pasta `.git` do seu repositório.

A raiz correta deve conter diretamente:

```text
app
lib
supabase
scripts
package.json
proxy.js
```

## 4. Instalar e validar

Na raiz correta:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-sprint2.ps1
```

## 5. Conferir o Git

```powershell
git status
```

Você deve ver, entre outros:

```text
proxy.js
lib/supabase/
app/history/
app/api/comparisons/
supabase/migrations/
```

## 6. Enviar para a branch de teste

```powershell
git add -A
git commit -m "Sprint 2 - Supabase, contas e histórico"
git push origin development
```

## 7. Ativar o Supabase

Antes ou depois do push:

1. Execute a migration SQL no Supabase.
2. Cadastre as duas variáveis públicas na Vercel.
3. Faça um novo deploy da branch `development`.
4. Teste pelo endereço Preview.

Somente após os testes:

```powershell
git switch main
git pull origin main
git merge development
git push origin main
```
