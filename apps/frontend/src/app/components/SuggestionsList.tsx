"use client"

import { Label } from "@/components/label"
import { useSuggestions } from "@/utils/api"
import { Suggestion } from "./Suggestion"
import { ApplySuggestionsButton } from "./ApplySuggestionsButton"

export function SuggestionsList({ fileId }: { fileId: string }) {
  const { data: suggestions, isLoading } = useSuggestions(fileId)

  if (isLoading) {
    return <div className="p-4">Loading suggestions...</div>
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold">Suggestions</Label>
        <ApplySuggestionsButton fileId={fileId} />
      </div>
      {suggestions?.map((suggestion) => (
        <Suggestion key={suggestion.suggestionId} suggestion={suggestion} />
      ))}
      {suggestions?.length === 0 && (
        <p className="text-sm text-gray-500">No suggestions available</p>
      )}
    </div>
  )
}
