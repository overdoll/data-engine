"use client"

import { Button } from "@/components/button"
import { useApplySuggestion } from "@/utils/api"
import { useSuggestionsStore } from "@/stores/suggestions"
import { toast } from "@/utils/toast"
import WandSparkle from "@/icons/wand-sparkle"

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
    <Button
      variant="secondary"
      size="small"
      onClick={handleApplySelected}
      disabled={isPending || selectedSuggestions.length === 0}
      className="bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 hover:text-amber-800 flex items-center gap-2"
    >
      <WandSparkle className="w-4 h-4" />
      Fix
    </Button>
  )
}
