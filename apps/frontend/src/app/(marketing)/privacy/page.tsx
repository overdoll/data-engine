"use client"
import { Heading } from "@/components/heading"
import { Button } from "@/components/button"
import { ContactModal } from "../_components/ContactModal"
import Link from "next/link"
import { useState } from "react"

export default function PrivacyPage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Heading level="h1" className="mb-8">
        Your data privacy is our priority
      </Heading>

      <div className="space-y-8">
        <p className="text-gray-600">
          wispbit was build with data privacy in mind. We built this page to tell you all about it.
        </p>

        <section>
          <Heading level="h2" className="mb-4">
            How we protect your data
          </Heading>
          <ul className="space-y-4 text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>We delete any data you uploaded after 24 hours</p>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>
                We use OpenAI under the hood for some features for manipulating data. OpenAI does
                not use your data for training and has a commitment to privacy.{" "}
                <Link
                  href="https://openai.com/enterprise-privacy/"
                  className="text-purple-600 hover:text-purple-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View their data privacy policy
                </Link>
                . OpenAI is{" "}
                <Link
                  href="https://trust.openai.com/"
                  className="text-purple-600 hover:text-purple-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SOC2 certified
                </Link>
                .
              </p>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>
                We use Amazon Web Services to store, retrieve, and process your data. All data is
                encrypted.{" "}
                <Link
                  href="https://aws.amazon.com/compliance/data-protection/"
                  className="text-purple-600 hover:text-purple-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View their data privacy policy
                </Link>
                . AWS is{" "}
                <Link
                  href="https://aws.amazon.com/compliance/soc-faqs/"
                  className="text-purple-600 hover:text-purple-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SOC2 certified
                </Link>
                .
              </p>
            </li>
          </ul>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            How we manage our services
          </Heading>
          <ul className="space-y-4 text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>
                We use PostHog for tracking how our users are using wispbit. We do not send any data
                related to your uploads to PostHog.{" "}
                <Link
                  href="https://posthog.com/privacy"
                  className="text-purple-600 hover:text-purple-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View their privacy policy
                </Link>
                . PostHog is{" "}
                <Link
                  href="https://drive.google.com/file/d/1uLBE83_pN5q7p7IA-Ut85ArQh9BBzEdw/view"
                  className="text-purple-600 hover:text-purple-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SOC2 certified
                </Link>
                .
              </p>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <p>
                We use Sentry for error tracking and service monitoring. We scrub service logs so
                your data is never sent to Sentry.{" "}
                <Link
                  href="https://sentry.io/trust/privacy/"
                  className="text-purple-600 hover:text-purple-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View their privacy policy
                </Link>
                . Sentry is{" "}
                <Link
                  href="https://sentry.io/trust"
                  className="text-purple-600 hover:text-purple-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SOC2 certified
                </Link>
                .
              </p>
            </li>
          </ul>
        </section>

        <section className="bg-purple-50 p-8 rounded-lg">
          <Heading level="h2" className="mb-4">
            Enterprise Data Control
          </Heading>
          <p className="text-gray-600 mb-6">
            If you want full control of your data and storage, we can offer the following services
            via our enterprise offering:
          </p>
          <ul className="space-y-2 text-gray-600 mb-8">
            <li className="flex items-center">
              <span className="mr-2">•</span>
              <p>Bring Your Own OpenAI API key</p>
            </li>
            <li className="flex items-center">
              <span className="mr-2">•</span>
              <p>Bring Your Own Storage layer (AWS, GCP, etc.)</p>
            </li>
            <li className="flex items-center">
              <span className="mr-2">•</span>
              <p>Deploy wispbit on your own infrastructure (On prem)</p>
            </li>
          </ul>
          <Button
            onClick={() => setIsContactModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Contact Us
          </Button>
        </section>
      </div>

      <p className="mt-8 text-gray-600 text-center">
        For additional information, please see our{" "}
        <Link href="/privacy-policy" className="text-purple-600 hover:text-purple-700">
          Privacy Policy
        </Link>
        .
      </p>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  )
}
