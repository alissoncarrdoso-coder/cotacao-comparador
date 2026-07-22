import './globals.css'

export const metadata = {
  title: 'Comparador de Cotações',
  description: 'Compare preços de orçamentos em PDF automaticamente'
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
