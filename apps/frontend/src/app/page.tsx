"use client"

import { FileList } from "./components/FileList"
import { FileUpload } from "./components/FileUpload"
import { CsvViewer } from "./components/CsvViewer"
import { useState } from "react"

export default function Home() {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  if (!selectedFileId) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-screen">
        <FileUpload />
        <FileList onFileSelect={setSelectedFileId} />
      </div>
    )
  }

  return (
    <main className="flex flex-col gap-3">
      <div className="w-full border-b p-3 flex justify-between">
        <div>active file name</div>
        <div>wispbit</div>
      </div>
      {selectedFileId && (
        <div className="flex gap-4 px-2">
          <CsvViewer fileId={selectedFileId} />
          <div className="h-[calc(100vh-32px)] bg-ui-bg-base border-ui-border-base flex flex-col rounded-lg border w-[300px]"></div>
        </div>
      )}
    </main>
  )
}
