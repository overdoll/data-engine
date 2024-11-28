"use client"

import { Bug, Sparkles } from "@/icons/index"
import { useModeStore } from "@/stores/mode"
import { clx } from "@/utils/clx"

export function ModeToggle() {
  const { mode, setMode } = useModeStore()

  const toggle = () => {
    setMode(mode === "clean" ? "deduplicate" : "clean")
    window.gridApi?.refreshCells({ force: true })
    window.gridApi?.refreshServerSide()
  }

  return (
    <button
      onClick={toggle}
      className="relative flex h-8 w-[160px] items-center rounded-md bg-secondary p-1 shadow-buttons-neutral"
      aria-label={`Switch to ${mode === "clean" ? "dedupe" : "clean"} mode`}
    >
      <span className="sr-only">{mode === "clean" ? "Clean mode" : "Dedupe mode"}</span>
      <div
        className={clx(
          "flex h-7 w-[80px] items-center justify-center rounded-md text-xs font-medium transition-all",
          mode === "clean"
            ? "bg-ui-button-inverted text-ui-contrast-fg-primary"
            : "ml-[80px] text-ui-fg-on-color bg-ui-button-danger"
        )}
      >
        {mode === "clean" ? (
          <>
            <Bug className="mr-1 h-4 w-4" />
            Clean
          </>
        ) : (
          <>
            <Sparkles className="mr-1 h-4 w-4" />
            Dedupe
          </>
        )}
      </div>
    </button>
  )
}
