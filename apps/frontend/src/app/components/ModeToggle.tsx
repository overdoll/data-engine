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
      className="relative flex h-8 w-[170px] items-center rounded-md bg-secondary p-1 shadow-buttons-neutral"
      aria-label={`Switch to ${mode === "clean" ? "dedupe" : "clean"} mode`}
    >
      <span className="sr-only">{mode === "clean" ? "Clean mode" : "Dedupe mode"}</span>
      <div className="absolute inset-0 flex items-center justify-between px-2">
        <span
          className={clx(
            "flex items-center text-xs font-medium transition-opacity ml-2",
            mode === "clean" ? "opacity-0" : "opacity-30"
          )}
        >
          <Bug className="mr-1 h-4 w-4" />
          Clean
        </span>
        <span
          className={clx(
            "flex items-center text-xs font-medium transition-opacity mr-1",
            mode === "clean" ? "opacity-30" : "opacity-0"
          )}
        >
          <Sparkles className="mr-1 h-4 w-4" />
          Dedupe
        </span>
      </div>
      <div
        className={clx(
          "flex h-7 w-[80px] items-center justify-center rounded-md text-xs font-medium transition-all",
          mode === "clean"
            ? "bg-emerald-500 text-ui-contrast-fg-primary"
            : "ml-[80px] w-[110px] text-ui-fg-on-color bg-purple-500"
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
