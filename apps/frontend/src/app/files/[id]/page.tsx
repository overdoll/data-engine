"use client"

import { CsvViewer } from "../../components/CsvViewer"
import { useParams } from "next/navigation"
import { TypeSelectionModal } from "../../components/TypeSelectionModal"
import { useEffect } from "react"
import { useSuggestionsStore } from "@/stores/suggestions"
import { useTransformationStore } from "@/stores/useTransformationStore"
import { useDuplicatesStore } from "@/stores/duplicates"
import { Sidebar } from "../../components/Sidebar"
import { useModeStore } from "@/stores/mode"
import { TopBar } from "../../components/TopBar"
import { useDeduplicateListener } from "../../components/useDeduplicateListener"

export default function FileViewerPage() {
  const params = useParams()
  const fileId = params.id as string

  // clear all stores on initial load
  useEffect(() => {
    useSuggestionsStore.getState().resetState()
    useTransformationStore.getState().resetState()
    useDuplicatesStore.getState().resetState()
    useModeStore.getState().setMode("clean")
  }, [])

  return (
    <main className="flex flex-col gap-3">
      <TopBar fileId={fileId} />
      <div className="flex gap-4 px-2">
        <CsvViewer fileId={fileId} />
        <Sidebar fileId={fileId} />
      </div>
      <TypeSelectionModal fileId={fileId} />
      <Listener fileId={fileId} />
    </main>
  )
}

function Listener({ fileId }: { fileId: string }) {
  useDeduplicateListener(fileId)
  return null
}
