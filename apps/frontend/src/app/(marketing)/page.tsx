import { PricingSection } from "./_components/PricingSection"
import { Heading } from "@/components/heading"
import { BenefitsSection } from "./_components/BenefitsSection"
import Link from "next/link"
import { FaqSection } from "./_components/FaqSection"

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section id="home" className="pt-24 sm:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Heading level="h1" className="text-4xl sm:text-6xl font-bold text-gray-900 mb-8">
              Clean and deduplicate your data
              <span className="text-purple-600"> instantly</span>
            </Heading>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Stop spending hours in spreadsheets cleaning and deduplicating your data. Do it in a
              few clicks, powered by AI.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BenefitsSection />
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="py-16 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <Heading level="h1" className="text-4xl font-bold text-center mb-12 text-white">
            Your privacy. First.
          </Heading>

          <div className="space-y-8">
            <section>
              <Heading level="h1" className="mb-4 text-white">
                How we protect your data
              </Heading>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <p>We delete any files you uploaded after 24 hours.</p>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <p>
                    We use OpenAI under the hood for some features for manipulating data. This data
                    is not used for training.
                  </p>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <p>
                    We use Amazon Web Services to store, retrieve, and process your data. All data
                    is encrypted.
                  </p>
                </li>
              </ul>
              <div className="mt-6 text-center">
                <Link href="/privacy" className="text-purple-400 hover:text-purple-300 font-medium">
                  Learn more about our privacy →
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16">
        <PricingSection />
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <FaqSection />
      </section>
    </>
  )
}
