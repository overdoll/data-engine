import { Button } from "@/components/button"
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs"
import Link from "next/link"
import { Metadata } from "next"
import { ScrollHandler } from "./_components/ScrollHandler"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Clean and deduplicate data - wispbit.com",
  description: "Clean and deduplicate data instantly, using wispbit.",
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollHandler />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-50 border-b">
        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12 items-center">
            {/* Left side - Navigation Links */}
            <div className="flex items-center space-x-8 pl-2">
              <Link href="/#home" className="flex items-center">
                <Image src="/icon-192.png" alt="Wispbit Logo" width={32} height={32} />
              </Link>
              <Link
                href="/#home"
                className="text-gray-800 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>

              <Link
                href="/#privacy"
                className="text-gray-800 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/#pricing"
                className="text-gray-800 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Pricing
              </Link>
            </div>

            {/* Right side - Auth Buttons */}
            <div className="flex items-center gap-4">
              <SignedIn>
                <Link href="/files">
                  <Button variant="secondary">Go to App</Button>
                </Link>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/files">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white font-medium">
                    Get Started
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-16">{children}</div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Security</h4>
              <p className="text-gray-400">
                Your data is automatically deleted after 24 hours for maximum security.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
