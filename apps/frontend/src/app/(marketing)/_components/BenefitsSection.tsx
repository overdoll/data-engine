import { Container } from "@/components/container"
import { Heading } from "@/components/heading"
import Image from "next/image"

export function BenefitsSection() {
  return (
    <div className="space-y-4">
      {/* Clean Section */}
      <Container>
        <div className="grid md:grid-cols-2 gap-8 items-center min-h-screen">
          <div className="w-full max-w-full space-y-2">
            <Image
              src="/clean-data-1.png"
              alt="Data cleaning interface - Step 1"
              width={600}
              height={400}
              className="rounded-lg w-full h-auto"
            />
            <Image
              src="/custom-fix-2.png"
              alt="Data cleaning interface - Step 2"
              width={600}
              height={400}
              className="rounded-lg w-full h-auto"
            />
          </div>

          <div className="w-full max-w-full">
            <Heading level="h1" className="mb-6 text-3xl md:text-4xl">
              Clean and standardize your data
            </Heading>
            <div className="space-y-4 text-sm md:text-base">
              <p className="text-gray-600">
                Don't spend hours looking through each column yourself and fixing the data.
              </p>
              <p className="text-gray-600">
                Get suggestions for cleaning your data as soon as you upload it, and apply them with
                one click.
              </p>
              <p className="text-gray-600">
                Don't see any suggestions? No problem. Just ask the AI to clean it for you.
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* Deduplicate Section */}
      <Container>
        <div className="grid md:grid-cols-2 gap-8 items-center min-h-screen">
          <div className="w-full max-w-full space-y-2">
            <Image
              src="/deduplicate-1.png"
              alt="Deduplication interface - Step 1"
              width={600}
              height={400}
              className="rounded-lg w-full h-auto"
            />
            <Image
              src="/deduplicate-2.png"
              alt="Deduplication interface - Step 2"
              width={600}
              height={400}
              className="rounded-lg w-full h-auto"
            />
          </div>

          <div className="w-full max-w-full">
            <Heading level="h1" className="mb-4 text-3xl md:text-4xl">
              Deduplicate records automatically
            </Heading>
            <div className="space-y-4 text-sm md:text-base">
              <p className="text-gray-600">
                Your data is automatically deduplicated while you are cleaning it.
              </p>
              <p className="text-gray-600">
                Want to specify your own criteria? You can change which columns you want to
                deduplicate on.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
