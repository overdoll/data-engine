import { Button, ButtonProps } from "@/components/button"
import WandSparkle from "@/icons/wand-sparkle"

export function FixButton(props: ButtonProps) {
  return (
    <Button
      variant="secondary"
      size="small"
      className="bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 hover:text-amber-800 flex items-center gap-2"
      {...props}
    >
      <WandSparkle className="w-4 h-4" />
      Fix
    </Button>
  )
}
