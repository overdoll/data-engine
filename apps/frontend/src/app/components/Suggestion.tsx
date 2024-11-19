"use client"

import { Checkbox } from "@/components/checkbox"
import type { Suggestion as SuggestionType } from "@/utils/api"
import { useSuggestionsStore } from "@/stores/suggestions"
import { Label } from "@/components/label"
import { clx } from "@/utils/clx"

interface SuggestionProps {
  suggestion: SuggestionType
}

export function Suggestion({ suggestion }: SuggestionProps) {
  const { toggleSuggestion, isSelected } = useSuggestionsStore()
  const selected = isSelected(suggestion)

  return (
    <div
      className={clx(
        "py-3 px-3 border rounded-md flex gap-3 cursor-pointer",
        selected && "border-blue-200 bg-blue-50/50"
      )}
      onClick={() => toggleSuggestion(suggestion)}
    >
      <div className="flex items-start pt-0.5">
        <Checkbox checked={selected} />
      </div>
      <div className="flex-1">
        <Label className="font-medium mb-1">{suggestion.label}</Label>
        <p className="text-xs text-gray-600">{suggestion.description}</p>
      </div>
    </div>
  )
}
