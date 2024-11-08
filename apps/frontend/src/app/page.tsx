"use client"

import { FileList } from "./components/FileList"
import { FileUpload } from "./components/FileUpload"
import { CsvViewer } from "./components/CsvViewer"
import { useState } from "react"

export default function Home() {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  console.log(selectedFileId)

  return (
    <main className="min-h-screen p-4">
      <div className="mb-4">
        <FileUpload />
      </div>
      <div className="flex gap-4">
        <div className="w-64">
          <FileList onFileSelect={setSelectedFileId} />
        </div>
        {selectedFileId && <CsvViewer fileId={selectedFileId} />}
      </div>
    </main>
  )
}
