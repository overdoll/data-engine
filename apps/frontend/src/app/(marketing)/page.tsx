import { PricingSection } from "./_components/PricingSection"
import { Heading } from "@/components/heading"
import { Tabs } from "@/components/tabs"
import { Container } from "@/components/container"

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section id="home" className="pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-8">
              Clean and deduplicate your data
              <span className="text-purple-600"> instantly</span>
            </h1>
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
          <Tabs defaultValue="clean">
            <Tabs.List className="grid w-full grid-cols-2 max-w-[400px] mx-auto mb-8">
              <Tabs.Trigger value="clean" className="text-lg">
                Clean
              </Tabs.Trigger>
              <Tabs.Trigger value="deduplicate" className="text-lg">
                Deduplicate
              </Tabs.Trigger>
            </Tabs.List>
            <Container className="mt-8">
              <Tabs.Content value="clean">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <Heading level="h3" className="mb-4">
                      Clean and standardize your data using AI
                    </Heading>
                    <p className="text-gray-600">
                      Transform messy data into clean, standardized formats instantly. Our
                      AI-powered cleaning tools handle the heavy lifting for you.
                    </p>
                  </div>
                  <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
                    <p className="text-gray-600">Screenshot placeholder: Data cleaning interface</p>
                  </div>
                </div>
              </Tabs.Content>
              <Tabs.Content value="deduplicate">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <Heading level="h3" className="mb-4">
                      Deduplicate records automatically
                    </Heading>
                    <p className="text-gray-600">
                      Find and merge duplicate records with intelligent matching. Get clean,
                      deduplicated data ready for use in minutes.
                    </p>
                  </div>
                  <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
                    <p className="text-gray-600">Screenshot placeholder: Deduplication interface</p>
                  </div>
                </div>
              </Tabs.Content>
            </Container>
          </Tabs>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16">
        <PricingSection />
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <Heading level="h2" className="text-center mb-12">
            Your data privacy is our priority
          </Heading>

          <div className="space-y-8">
            <section>
              <Heading level="h3" className="mb-4">
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
                    We use OpenAI under the hood for some features for manipulating data. OpenAI
                    does not use your data for training and has a commitment to privacy.
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
            </section>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid gap-8 max-w-3xl mx-auto">
            {[
              {
                question: "How does the 24-hour data retention work?",
                answer:
                  "For your security, all uploaded data is automatically deleted after 24 hours. We recommend downloading your merged results immediately after processing.",
              },
              {
                question: "Can I upgrade or downgrade my plan?",
                answer:
                  "Yes, you can change your plan at any time by contacting support. Changes will be reflected in your next billing cycle.",
              },
              {
                question: "How do you ensure data privacy?",
                answer:
                  "We take data privacy seriously. Your data is encrypted, automatically deleted after 24 hours, and we use trusted SOC2 certified providers.",
              },
            ].map((faq) => (
              <div key={faq.question} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
