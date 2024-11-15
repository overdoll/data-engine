"use client"

import { FileList } from "./components/FileList"
import { FileUpload } from "./components/FileUpload"
import { Heading } from "@/components/heading/heading"
import { Label } from "@/components/label/label"

export default function Home() {
  return (
    <div className="flex flex-col gap-3 items-center justify-center min-h-screen">
      <div className="text-center max-w-2xl mb-2">
        <Heading level="h1" className="mb-3">
          Data Merge Tool
        </Heading>
      </div>
      <FileUpload />
      <FileList />
      <Label size="xsmall" className="text-gray-400 text-center">
        All data is automatically deleted after 24 hours
      </Label>
    </div>
  )
}
