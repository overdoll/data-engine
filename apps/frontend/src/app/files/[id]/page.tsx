"use client"

import { useFileMetadata } from "@/utils/api"
import { CsvViewer } from "../../components/CsvViewer"
import { useParams } from "next/navigation"
import { Label } from "@/components/label"
import { ExportDropdown } from "../../components/ExportDropdown"
import Head from "next/head"
import Link from "next/link"
import { SuggestionsList } from "../../components/SuggestionsList"
import { DuplicatesToggle } from "../../components/DuplicatesToggle"
import { TypeSelectionModal } from "../../components/TypeSelectionModal"

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
      <Head>{metadata.fileName}</Head>
      <div className="w-full border-b px-3 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <span>Files</span>
          </Link>
          <span className="text-gray-400">/</span>
          <Label size="large" className="text-gray-900">
            {metadata.fileName}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <DuplicatesToggle />
          <ExportDropdown fileName={metadata.fileName} />
        </div>
      </div>
      <div className="flex gap-4 px-2">
        <CsvViewer fileId={metadata.id} />
        <div className="h-[calc(100vh-79px)] bg-ui-bg-base border-ui-border-base flex flex-col rounded-lg border w-[300px]">
          <SuggestionsList fileId={metadata.id} />
        </div>
      </div>
      <TypeSelectionModal fileId={metadata.id} />
    </main>
  )
}
