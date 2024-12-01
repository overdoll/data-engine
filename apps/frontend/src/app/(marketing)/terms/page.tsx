import { Heading } from "@/components/heading"

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Heading level="h1" className="mb-8">
        Terms of Service
      </Heading>

      <div className="space-y-8">
        <section>
          <Heading level="h2" className="mb-4">
            1. Acceptance of Terms
          </Heading>
          <p className="text-gray-600">
            By accessing and using Dataset Manager, you accept and agree to be bound by the terms
            and provision of this agreement.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            2. Description of Service
          </Heading>
          <p className="text-gray-600">
            Dataset Manager provides tools for merging and managing datasets. All data uploaded to
            our service is automatically deleted after 24 hours.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            3. Data Usage
          </Heading>
          <p className="text-gray-600">
            You retain all rights to your data. We do not claim ownership over any datasets uploaded
            to our service. All data is automatically deleted after 24 hours.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            4. User Responsibilities
          </Heading>
          <p className="text-gray-600">
            You are responsible for maintaining the confidentiality of your account and password.
            You agree to accept responsibility for all activities that occur under your account.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            5. Service Modifications
          </Heading>
          <p className="text-gray-600">
            We reserve the right to modify or discontinue the service at any time, with or without
            notice to you.
          </p>
        </section>
      </div>
    </div>
  )
}
