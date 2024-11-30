import { PricingSection } from "./_components/PricingSection"
import { Logo } from "../components/Logo"

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <div className="pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-8">
              Data Merge Tool
              <span className="text-purple-600"> Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Effortlessly merge and manage your datasets with our powerful data management
              solution.
            </p>
            <div className="aspect-video max-w-4xl mx-auto bg-gray-100 rounded-lg shadow-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Demo Video Coming Soon
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Easy Upload",
                description: "Drag and drop your files for instant processing and merging.",
              },
              {
                title: "Smart Merging",
                description:
                  "Intelligent algorithms to handle your data merging needs efficiently.",
              },
              {
                title: "Secure Storage",
                description:
                  "Your data is automatically deleted after 24 hours for maximum security.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-purple-50 rounded-lg hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <PricingSection />
    </>
  )
}
