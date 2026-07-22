# 📊 Comparador de Cotações

Aplicativo para comparar preços de orçamentos em PDF automaticamente, usando IA para extrair e normalizar os itens mesmo com nomenclaturas diferentes entre fornecedores.

## ✨ Funcionalidades

- Upload de múltiplos PDFs de orçamentos
- Extração automática de itens e preços via Claude AI
- Normalização inteligente de nomenclaturas diferentes
- Tabela comparativa com destaque do melhor preço
- Cálculo de economia potencial por item e total
- Exportação em CSV (abre no Excel)

---

## 🚀 Deploy no Vercel (recomendado)

### 1. Subir para o GitHub

```bash
# Na pasta do projeto:
git init
git add .
git commit -m "Initial commit"

# Crie um repositório no github.com e rode:
git remote add origin https://github.com/SEU_USUARIO/cotacao-comparador.git
git push -u origin main
```

### 2. Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Importe o repositório `cotacao-comparador`
4. Na tela de configuração, **NÃO mexa em nada** — o Vercel detecta Next.js automaticamente

### 3. Adicionar a variável de ambiente

Antes de clicar em Deploy, adicione:

| Variável | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (sua chave da API Anthropic) |

> 🔑 Obtenha sua chave em [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

### 4. Deploy!

Clique em **Deploy** e aguarde ~2 minutos. Você receberá uma URL pública para acessar de qualquer lugar.

---

## 💻 Rodar localmente

```bash
# Instalar dependências
npm install

# Criar arquivo de ambiente
cp .env.example .env.local
# Edite .env.local e coloque sua chave da API

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 📖 Como usar

1. **Carregue os PDFs** — arraste ou clique para selecionar os orçamentos dos fornecedores
2. **Clique em "Comparar"** — a IA processa cada PDF e extrai os itens automaticamente
3. **Analise a tabela** — preços em **verde** são os melhores, em **vermelho** os mais caros
4. **Exporte se precisar** — botão "Exportar CSV" gera planilha para o Excel

---

## 🛠 Tecnologias

- [Next.js 14](https://nextjs.org) — framework React com API Routes
- [Anthropic Claude](https://anthropic.com) — extração e normalização de dados via IA
- [Tailwind CSS](https://tailwindcss.com) — estilização
- [Lucide React](https://lucide.dev) — ícones

---

## 💡 Observações

- O app processa PDFs no servidor — sua chave da API **nunca fica exposta** no navegador
- Funciona com qualquer layout de orçamento — a IA identifica os itens independentemente do formato
- Itens com nomenclaturas diferentes são agrupados automaticamente (ex: "Fio 2,5mm²" = "Cabo 2,5 mm")
