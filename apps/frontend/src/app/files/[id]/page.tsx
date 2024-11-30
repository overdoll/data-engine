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
import { DeduplicateListener } from "../../components/useDeduplicateListener"
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs"

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
    <>
      <SignedIn>
        <div className="flex flex-col gap-3">
          <TopBar fileId={fileId} />
          <div className="flex gap-4 px-2">
            <CsvViewer fileId={fileId} />
            <Sidebar fileId={fileId} />
          </div>
          <TypeSelectionModal fileId={fileId} />
          <DeduplicateListener fileId={fileId} />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
