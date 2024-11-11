"use client"

import { Label } from "@/components/label"
import { Button } from "@/components/button"
import { useApplySuggestion, useSuggestions } from "@/utils/api"
import { Suggestion } from "./Suggestion"
import { useSuggestionsStore } from "@/stores/suggestions"
import { toast } from "@/utils/toast"

export function SuggestionsList({ fileId }: { fileId: string }) {
  const { data: suggestions, isLoading } = useSuggestions(fileId)
  const { selectedSuggestions, clearSelections } = useSuggestionsStore()
  const { mutateAsync: applySuggestion, isPending } = useApplySuggestion(fileId)

  const handleApplySelected = async () => {
    if (selectedSuggestions.size === 0) {
      toast.error("Please select at least one suggestion")
      return
    }

    const selectedSuggestionsList = suggestions?.filter((suggestion) =>
      selectedSuggestions.has(`${suggestion.columnName}-${suggestion.action}`)
    )

    if (!selectedSuggestionsList?.length) return

    try {
      await applySuggestion(
        selectedSuggestionsList.map((suggestion) => ({
          columnName: suggestion.columnName,
          action: suggestion.action,
        }))
      )
      toast.success("Selected suggestions applied!")
      clearSelections()
    } catch {
      toast.error("Failed to apply suggestions")
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading suggestions...</div>
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold">Suggestions</Label>
        <Button
          variant="secondary"
          size="small"
          onClick={handleApplySelected}
          disabled={isPending || selectedSuggestions.size === 0}
        >
          {isPending ? "Applying..." : "Apply Selected"}
        </Button>
      </div>
      {suggestions?.map((suggestion, index) => (
        <Suggestion key={index} suggestion={suggestion} />
      ))}
      {suggestions?.length === 0 && (
        <p className="text-sm text-gray-500">No suggestions available</p>
      )}
    </div>
  )
}
