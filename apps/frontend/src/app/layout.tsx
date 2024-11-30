import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import Head from "next/head"
import QueryClientProvider from "./_providers/QueryClientProvider"
const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Head>
        <title>Dataset Manager</title>
      </Head>
      <body className={inter.className}>
        <ClerkProvider>
          <QueryClientProvider>{children}</QueryClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
