"use client"

import { Label } from "@/components/label"
import { Checkbox } from "@/components/checkbox"
import { useSuggestions } from "@/utils/api"
import { Suggestion } from "./Suggestion"
import { ApplySuggestionsButton } from "./ApplySuggestionsButton"
import { useSuggestionsStore } from "@/stores/suggestions"
import { useEffect, useRef } from "react"
import { SingleColumnPageSkeleton } from "@/components/skeleton"
import { useMostRecentUpload } from "@/stores/mostRecentUpload"
import { CustomTransformation } from "./CustomTransformation"

export function SuggestionsList({ fileId }: { fileId: string }) {
  const { toggleSuggestion, isSelected } = useSuggestionsStore()
  const mostRecentFileId = useMostRecentUpload((state) => state.fileId)
  const hasSelectedOnce = useRef(false)

  const { data: suggestions, isLoading } = useSuggestions(fileId, !mostRecentFileId)

  useEffect(() => {
    if (suggestions && !isLoading && !hasSelectedOnce.current) {
      toggleSuggestion(suggestions)
      hasSelectedOnce.current = true
    }
  }, [suggestions, isLoading, toggleSuggestion])

  if (isLoading) {
    return <SingleColumnPageSkeleton />
  }

  const handleSelectAll = () => {
    if (suggestions) {
      toggleSuggestion(suggestions)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
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
        </div>
      </div>
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
