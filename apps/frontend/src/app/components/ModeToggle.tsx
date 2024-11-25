"use client"

import { Button } from "@/components/button"
import { useModeStore } from "@/stores/mode"

export function ModeToggle() {
  const { mode, setMode } = useModeStore()

  const toggle = () => {
    setMode(mode === "clean" ? "deduplicate" : "clean")
  }

  return (
    <Button variant="primary" onClick={toggle} className="w-24">
      {mode === "clean" ? "Clean" : "Dedupe"}
    </Button>
  )
}
