import { Switch } from "@/components/switch/switch"
import { Label } from "@/components/label/label"
import { useDuplicatesStore } from "@/stores/duplicates"
import { useCallback } from "react"

export function DuplicatesToggle() {
  const { isShowingDuplicates, toggleDuplicates } = useDuplicatesStore()
  const onToggleDuplicates = useCallback(() => {
    toggleDuplicates()
    window.gridApi?.refreshCells({ force: true })
  }, [toggleDuplicates])

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="show-duplicates">Show duplicates</Label>
      <Switch
        id="show-duplicates"
        checked={isShowingDuplicates}
        onCheckedChange={onToggleDuplicates}
      />
    </div>
  )
}
