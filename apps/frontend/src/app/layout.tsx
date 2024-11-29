import "./globals.css"
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import Head from "next/head"
import QueryClientProvider from "./_providers/QueryClientProvider"
const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <Head>
          <title>Dataset Manager</title>
        </Head>
        <header>
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </header>
        <body className={inter.className}>
          <QueryClientProvider>{children}</QueryClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
