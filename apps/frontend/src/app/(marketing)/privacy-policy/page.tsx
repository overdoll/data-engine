import { Heading } from "@/components/heading"
import { Container } from "@/components/container/container"

export default function PrivacyPolicyPage() {
  return (
    <Container className="py-12">
      <article className="prose prose-purple max-w-4xl mx-auto">
        <Heading level="h1" className="mb-8">
          Privacy Policy
        </Heading>

        <p className="text-gray-600">Last updated: 2024-12-10</p>

        <section className="mt-8">
          <Heading level="h2" className="mb-4">
            1. Introduction
          </Heading>
          <p>
            This Privacy Policy describes how wispbit ("we," "us," or "our") collects, uses, and
            shares your personal information when you use our services.
          </p>
        </section>

        <section className="mt-8">
          <Heading level="h2" className="mb-4">
            2. Information We Collect
          </Heading>
          <h3 className="text-lg font-semibold mt-4 mb-2">2.1 Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account information (email address, name)</li>
            <li>Payment information (processed securely through our payment providers)</li>
            <li>Data you upload to our service</li>
            <li>Communications with us</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">
            2.2 Automatically Collected Information
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Usage data and analytics</li>
            <li>Device and browser information</li>
            <li>IP address and location data</li>
            <li>Cookies and similar technologies</li>
          </ul>
        </section>

        <section className="mt-8">
          <Heading level="h2" className="mb-4">
            3. How We Use Your Information
          </Heading>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and maintain our services</li>
            <li>To process your payments</li>
            <li>To communicate with you about our services</li>
            <li>To improve and optimize our services</li>
            <li>To detect and prevent fraud</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section className="mt-8">
          <Heading level="h2" className="mb-4">
            4. Data Retention
          </Heading>
          <p>
            We retain your uploaded data for 24 hours, after which it is automatically deleted.
            Account information is retained as long as you maintain an active account with us.
          </p>
        </section>

        <section className="mt-8">
          <Heading level="h2" className="mb-4">
            5. Data Sharing and Third-Party Services
          </Heading>
          <p>We share your data with the following third-party service providers:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>OpenAI - For AI processing features</li>
            <li>AWS - For data storage and processing</li>
            <li>PostHog - For analytics</li>
            <li>Sentry - For error tracking</li>
          </ul>
        </section>

        <section className="mt-8">
          <Heading level="h2" className="mb-4">
            6. Your Rights
          </Heading>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to data processing</li>
            <li>Export your data</li>
          </ul>
        </section>

        <section className="mt-8">
          <Heading level="h2" className="mb-4">
            7. Contact Us
          </Heading>
          <p>
            If you have any questions about this Privacy Policy, please contact us at
            hello@wispbit.com
          </p>
        </section>
      </article>
    </Container>
  )
}
