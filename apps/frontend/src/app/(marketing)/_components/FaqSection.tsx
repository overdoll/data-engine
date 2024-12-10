"use client"

import { ProgressAccordion } from "@/components/progress-accordion"
import { Heading } from "@/components/heading"

const faqs = [
  {
    question: "How does the 24-hour data retention work?",
    answer:
      "For your security, all uploaded data is automatically deleted after 24 hours. We recommend downloading your results immediately after processing.",
  },
  {
    question: "What kind of data can you process?",
    answer:
      "Currently we support cleaning and deduplicating Contacts and Companies. Please contact us if you would like a different type of dataset supported.",
  },
]

export function FaqSection() {
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Heading level="h2" className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </Heading>
        <div className="max-w-3xl mx-auto">
          <ProgressAccordion type="multiple" className="space-y-4">
            {faqs.map((faq) => (
              <ProgressAccordion.Item
                className="shadow-elevation-card-rest bg-ui-bg-base rounded-lg"
                key={faq.question}
                value={faq.question}
              >
                <ProgressAccordion.Header status="completed">
                  {faq.question}
                </ProgressAccordion.Header>
                <ProgressAccordion.Content>
                  <div className="text-gray-600 pb-6">{faq.answer}</div>
                </ProgressAccordion.Content>
              </ProgressAccordion.Item>
            ))}
          </ProgressAccordion>
        </div>
      </div>
    </div>
  )
}
