import { Heading } from "@/components/heading"

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Heading level="h1" className="mb-8">
        Privacy Policy
      </Heading>

      <div className="space-y-8">
        <section>
          <Heading level="h2" className="mb-4">
            Data Collection
          </Heading>
          <p className="text-gray-600">
            We collect only the minimum amount of data necessary to provide our service. This
            includes your email address for authentication and any datasets you upload.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            Data Storage
          </Heading>
          <p className="text-gray-600">
            All uploaded datasets are automatically deleted after 24 hours. We do not retain any
            uploaded data beyond this period. Your account information is stored securely using
            industry-standard encryption.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            Data Usage
          </Heading>
          <p className="text-gray-600">
            We do not sell, trade, or otherwise transfer your personal information to third parties.
            Your data is used solely for providing the dataset management service.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            Cookies
          </Heading>
          <p className="text-gray-600">
            We use essential cookies to maintain your session and authentication status. No tracking
            or marketing cookies are used.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            Your Rights
          </Heading>
          <p className="text-gray-600">
            You have the right to request access to your personal data, correct any inaccuracies,
            and request deletion of your account and associated data.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            Contact Us
          </Heading>
          <p className="text-gray-600">
            If you have any questions about this Privacy Policy, please contact us through our
            support channels.
          </p>
        </section>
      </div>
    </div>
  )
}
