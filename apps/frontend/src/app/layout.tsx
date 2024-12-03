import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import QueryClientProvider from "./_providers/QueryClientProvider"
import { Toaster } from "@/components/toaster"
import { Metadata } from "next"
import { PostHogProvider } from "./components/PostHogProvider"

import dynamic from "next/dynamic"

const PostHogPageView = dynamic(() => import("./components/PostHogPageView"), {
  ssr: false,
})

export const metadata: Metadata = {
  title: "wispbit",
  description: "A tool for cleaning and deduplicating files",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "64x64 32x32 24x24 16x16",
        type: "image/x-icon",
      },
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/manifest.json",
}

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider>
          <QueryClientProvider>
            <PostHogProvider>
              <PostHogPageView />
              <Toaster />
              {children}
            </PostHogProvider>
          </QueryClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
