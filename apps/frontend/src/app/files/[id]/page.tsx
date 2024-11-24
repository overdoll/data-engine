"use client"

import { useFileMetadata } from "@/utils/api"
import { CsvViewer } from "../../components/CsvViewer"
import { useParams } from "next/navigation"
import { Label } from "@/components/label"
import { ExportDropdown } from "../../components/ExportDropdown"
import Head from "next/head"
import Link from "next/link"
import { DuplicatesToggle } from "../../components/DuplicatesToggle"
import { TypeSelectionModal } from "../../components/TypeSelectionModal"
import { useEffect } from "react"
import { useSuggestionsStore } from "@/stores/suggestions"
import { useTransformationStore } from "@/stores/useTransformationStore"
import { useDuplicatesStore } from "@/stores/duplicates"
import { Sidebar } from "../../components/Sidebar"

export default function FileViewerPage() {
  const params = useParams()
  const fileId = params.id as string
  const { data: metadata, isLoading } = useFileMetadata(fileId)

  // clear all stores on initial load
  useEffect(() => {
    useSuggestionsStore.getState().resetState()
    useTransformationStore.getState().resetState()
    useDuplicatesStore.getState().resetState()
  }, [])

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
          <ExportDropdown fileName={metadata.fileName} />
        </div>
      </div>
      <div className="flex gap-4 px-2">
        <CsvViewer fileId={metadata.id} />
        <Sidebar fileId={metadata.id} />
      </div>
      <TypeSelectionModal fileId={metadata.id} />
    </main>
  )
}
