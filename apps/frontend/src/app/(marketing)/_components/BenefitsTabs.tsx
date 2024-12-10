"use client"

import { Container } from "@/components/container"
import { Heading } from "@/components/heading"
import { Tabs } from "@/components/tabs"

export function BenefitsTabs() {
  return (
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
                Transform messy data into clean, standardized formats instantly. Our AI-powered
                cleaning tools handle the heavy lifting for you.
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
                Find and merge duplicate records with intelligent matching. Get clean, deduplicated
                data ready for use in minutes.
              </p>
            </div>
            <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
              <p className="text-gray-600">Screenshot placeholder: Deduplication interface</p>
            </div>
          </div>
        </Tabs.Content>
      </Container>
    </Tabs>
  )
}
