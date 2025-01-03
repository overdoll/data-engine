"use client"

import { Button } from "@/components/button"
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs"
import Link from "next/link"
import { useState } from "react"
import { ContactModal } from "./ContactModal"
import { Container } from "@/components/container"
import { Heading } from "@/components/heading"

export function PricingSection() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Heading level="h2" className="text-3xl font-bold text-center mb-12">
          Pricing
        </Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Container>
            <div className="text-center mb-8">
              <Heading level="h3" className="text-2xl font-bold mb-4">
                Free
              </Heading>
              <p className="text-gray-600 mb-6">Perfect for trying out the tool</p>
              <div className="text-4xl font-bold mb-2">$0</div>
              <div className="text-gray-500">3 files per month</div>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Data cleaning
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Data deduplication
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                24-hour data retention
              </li>
            </ul>
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Get Started</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/files">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Go to App</Button>
              </Link>
            </SignedIn>
          </Container>

          {/* Pro Plan */}
          <Container className="border-2 border-purple-500">
            <div className="text-center mb-8">
              <Heading level="h3" className="text-2xl font-bold mb-4">
                Pro
              </Heading>
              <p className="text-gray-600 mb-6">For power users</p>
              <div className="text-4xl font-bold mb-2">$49</div>
              <div className="text-gray-500">Unlimited files</div>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Everything in Free
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Generous file upload limit
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Priority support
              </li>
            </ul>
            <Button
              onClick={() => setIsContactModalOpen(true)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Chat with us
            </Button>
          </Container>
        </div>
      </div>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  )
}
