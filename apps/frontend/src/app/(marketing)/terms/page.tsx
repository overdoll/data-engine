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
            1. Agreement to Terms
          </Heading>
          <p className="text-gray-600">
            These Terms of Service ("Terms") constitute a legally binding agreement between you and
            wispbit ("we," "us," or "our") governing your access to and use of the wispbit service,
            including any associated websites, applications, and services (collectively, the
            "Service"). By accessing or using the Service, you agree to be bound by these Terms. If
            you do not agree to these Terms, do not access or use the Service.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            2. Service Description and License
          </Heading>
          <p className="text-gray-600">
            wispbit provides tools and services for merging and managing datasets ("Content").
            Subject to these Terms, we grant you a limited, non-exclusive, non-transferable,
            non-sublicensable license to access and use the Service for your personal or business
            purposes. All data uploaded to our service is automatically deleted after 24 hours as
            part of our data retention policy.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            3. Intellectual Property Rights
          </Heading>
          <p className="text-gray-600">
            You retain all rights, title, and interest in and to any data you upload to the Service
            ("User Content"). By uploading User Content, you grant us a worldwide, non-exclusive,
            royalty-free license to host, store, and process the User Content solely for the purpose
            of providing the Service to you. We do not claim ownership rights over your User
            Content. The Service and all related intellectual property rights belong to us or our
            licensors.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            4. User Obligations and Account Security
          </Heading>
          <p className="text-gray-600">
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activities that occur under your account. You agree to: (a) immediately notify
            us of any unauthorized use of your account or any other breach of security; (b) ensure
            that you exit from your account at the end of each session; and (c) use reasonable
            efforts to prevent unauthorized access to your account. You represent and warrant that
            any User Content you upload to the Service does not infringe upon any third-party
            rights.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            5. Modifications and Termination
          </Heading>
          <p className="text-gray-600">
            We reserve the right, at our sole discretion, to modify, suspend, or terminate the
            Service, these Terms, or any part thereof at any time, with or without notice. Your
            continued use of the Service following any modifications to these Terms constitutes your
            acceptance of such changes. We may terminate or suspend your access to the Service
            immediately, without prior notice or liability, for any reason.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            6. Disclaimer of Warranties
          </Heading>
          <p className="text-gray-600">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            WHETHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL
            WARRANTIES, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            7. Limitation of Liability
          </Heading>
          <p className="text-gray-600">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION,
            LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR
            ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
          </p>
        </section>

        <section>
          <Heading level="h2" className="mb-4">
            8. Governing Law
          </Heading>
          <p className="text-gray-600">
            These Terms shall be governed by and construed in accordance with the laws of the
            jurisdiction in which we operate, without regard to its conflict of law provisions. Any
            disputes arising under or in connection with these Terms shall be subject to the
            exclusive jurisdiction of the courts in that jurisdiction.
          </p>
        </section>
      </div>
    </div>
  )
}
