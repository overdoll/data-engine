"use client"

import { Label } from "@/components/label"
import { Checkbox } from "@/components/checkbox"
import { useSuggestions } from "@/utils/api"
import { Suggestion } from "./Suggestion"
import { ApplySuggestionsButton } from "./ApplySuggestionsButton"
import { useSuggestionsStore } from "@/stores/suggestions"
import { useEffect } from "react"
import { useMostRecentUpload } from "@/stores/mostRecentUpload"
import { CustomTransformation } from "./CustomTransformation"
import { SidebarHeader } from "./Sidebar"
import { Skeleton } from "@/components/skeleton"

export function SuggestionsSidebar({ fileId }: { fileId: string }) {
  const { toggleSuggestion, isSelected, hasAutoSelected, setHasAutoSelected } =
    useSuggestionsStore()
  const mostRecentFileId = useMostRecentUpload((state) => state.fileId)

  const { data: suggestions, isLoading } = useSuggestions(fileId, !mostRecentFileId)

  useEffect(() => {
    if (suggestions && !isLoading && !hasAutoSelected) {
      toggleSuggestion(suggestions)
      setHasAutoSelected()
    }
  }, [suggestions, isLoading, toggleSuggestion, hasAutoSelected, setHasAutoSelected])

  if (isLoading)
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )

  const handleSelectAll = () => {
    if (suggestions) {
      toggleSuggestion(suggestions)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Checkbox
            disabled={!suggestions || suggestions?.length === 0}
            checked={suggestions && suggestions?.length > 0 ? isSelected(suggestions) : false}
            onCheckedChange={handleSelectAll}
          />
          <Label className="text-md font-semibold">
            Available fixes ({suggestions?.length || 0})
          </Label>
        </div>
        <ApplySuggestionsButton fileId={fileId} />
      </SidebarHeader>
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-4">
          {suggestions?.map((suggestion) => (
            <Suggestion key={suggestion.suggestion_id} suggestion={suggestion} />
          ))}
          <CustomTransformation fileId={fileId} />
        </div>
      </div>
    </div>
  )
}
