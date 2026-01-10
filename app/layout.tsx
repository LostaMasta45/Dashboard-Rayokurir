import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Rayo Kurir Dashboard",
  description: "Kurir Lokal Andalan Warga - Sistem manajemen kurir profesional",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/favicon-16x16.jpg", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.jpg", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.jpg", sizes: "180x180", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={3000}
            toastOptions={{
              style: {
                background: "white",
                border: "1px solid #e5e7eb",
                color: "#374151",
              },
            }}
          />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
