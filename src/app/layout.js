import { Inter } from 'next/font/google'
import "./globals.css"
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Pokémon Reports Generator",
  description: "Generate and download Pokémon reports by type with real-time updates",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
          {children}
        </div>
        <Toaster 
          position="top-right" 
          richColors 
          theme="dark"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </body>
    </html>
  )
}