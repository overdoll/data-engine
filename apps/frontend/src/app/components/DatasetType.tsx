import { Label } from "@/components/label"
import { Tooltip, TooltipProvider } from "@/components/tooltip"
import Buildings from "@/icons/buildings"
import User from "@/icons/user"

export function DatasetType({ datasetType }: { datasetType: "COMPANY" | "PERSON" }) {
  return (
    <TooltipProvider>
      <Tooltip content="Dataset type cannot be changed after initial selection">
        <div className="flex items-center gap-2">
          {datasetType === "COMPANY" && (
            <>
              <Buildings className="h-4 w-4" />
              <Label size="large">Company</Label>
            </>
          )}
          {datasetType === "PERSON" && (
            <>
              <User className="h-4 w-4" />
              <Label size="large">Person</Label>
            </>
          )}
        </div>
      </Tooltip>
    </TooltipProvider>
  )
}
