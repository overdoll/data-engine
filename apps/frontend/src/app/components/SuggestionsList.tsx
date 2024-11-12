"use client"

import { Label } from "@/components/label"
import { Checkbox } from "@/components/checkbox"
import { useSuggestions } from "@/utils/api"
import { Suggestion } from "./Suggestion"
import { ApplySuggestionsButton } from "./ApplySuggestionsButton"
import { useSuggestionsStore } from "@/stores/suggestions"
import { useEffect, useRef } from "react"

export function SuggestionsList({ fileId }: { fileId: string }) {
  const { selectAll, isAllSelected } = useSuggestionsStore()
  const hasSelectedOnce = useRef(false)

  const { data: suggestions, isLoading } = useSuggestions(fileId)

  useEffect(() => {
    if (suggestions && !isLoading && !hasSelectedOnce.current) {
      selectAll(suggestions)
      hasSelectedOnce.current = true
    }
  }, [suggestions, isLoading, selectAll])

  if (isLoading) {
    return <div className="p-4">Loading suggestions...</div>
  }

  const handleSelectAll = () => {
    if (suggestions) {
      selectAll(suggestions)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isAllSelected(suggestions || [])}
              onCheckedChange={handleSelectAll}
            />
            <Label className="text-md font-semibold">
              Possible fixes ({suggestions?.length || 0})
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
          {suggestions?.length === 0 && (
            <p className="text-sm text-gray-500">No suggestions available</p>
          )}
        </div>
      </div>
    </div>
  )
}
