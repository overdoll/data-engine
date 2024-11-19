"use client"

import { useApplySuggestion } from "@/utils/api"
import { useSuggestionsStore } from "@/stores/suggestions"
import { toast } from "@/utils/toast"
import { FixButton } from "./FixButton"

interface ApplySuggestionsButtonProps {
  fileId: string
}

export function ApplySuggestionsButton({ fileId }: ApplySuggestionsButtonProps) {
  const { selectedSuggestions, clearSelections } = useSuggestionsStore()
  const { mutateAsync: applySuggestion, isPending } = useApplySuggestion(fileId)

  const handleApplySelected = async () => {
    if (selectedSuggestions.length === 0) {
      toast.error("Please select at least one suggestion")
      return
    }

    try {
      await applySuggestion(
        selectedSuggestions.map((suggestion) => ({
          column_id: suggestion.column_id,
          classification: suggestion.classification,
        }))
      )
      toast.success("Selected suggestions applied!")
      clearSelections()
    } catch {
      toast.error("Failed to apply suggestions")
    }
  }

  return (
    <FixButton
      onClick={handleApplySelected}
      disabled={isPending || selectedSuggestions.length === 0}
    />
  )
}
