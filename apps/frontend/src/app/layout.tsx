"use client"
import "./globals.css"
import { Inter } from "next/font/google"
import { QueryClientProvider } from "@tanstack/react-query"
import Head from "next/head"
import { queryClient } from "@/utils/api"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Head>
        <title>Dataset Manager</title>
      </Head>
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </body>
    </html>
  )
}
