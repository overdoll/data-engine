"use client"

import { useFileMetadata } from "@/utils/api"
import { CsvViewer } from "../../components/CsvViewer"
import { useParams } from "next/navigation"
import ArrowLeft from "@/icons/arrow-left"

export default function FileViewerPage() {
  const params = useParams()
  const fileId = params.id as string
  const { data: metadata, isLoading } = useFileMetadata(fileId)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!metadata) {
    return <div>File not found</div>
  }

  return (
    <main className="flex flex-col gap-3">
      <div className="w-full border-b p-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="hover:bg-gray-100 p-2 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>{metadata.fileName}</div>
        </div>
        <div>wispbit</div>
      </div>
      <div className="flex gap-4 px-2">
        <CsvViewer fileId={metadata.id} />
        <div className="h-[calc(100vh-79px)] bg-ui-bg-base border-ui-border-base flex flex-col rounded-lg border w-[300px]"></div>
      </div>
    </main>
  )
}
