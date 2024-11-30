import { PricingSection } from "../_components/PricingSection"
import Link from "next/link"
export default function PricingPage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that best fits your needs. All plans include core features.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <div className="py-16 bg-white">
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
                  "Yes, you can change your plan at any time. Changes will be reflected in your next billing cycle.",
              },
              {
                question: "Is there a limit to file sizes?",
                answer:
                  "Basic plans can upload files up to 100MB, Pro plans up to 500MB, and Enterprise plans have custom limits.",
              },
              {
                question: "Do you offer custom solutions?",
                answer:
                  "Yes! Our Enterprise plan can be customized to your specific needs. Contact us to discuss your requirements.",
              },
            ].map((faq) => (
              <div key={faq.question} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Something Special?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Our Enterprise plan can be customized to your specific needs. Let's talk about how we
            can help you.
          </p>
          <Link
            href="mailto:contact@example.com"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-purple-600 text-white hover:bg-purple-700 h-10 px-4 py-2"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  )
}
