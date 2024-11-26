import { Label } from "@/components/label"
import { Tooltip, TooltipProvider } from "@/components/tooltip"
import { DatasetTypeIcon } from "./DatasetTypeIcon"
import { DATASET_TYPES } from "@/utils/dataset-types"
import { DatasetType as DatasetTypeEnum } from "@/utils/api"

export function DatasetType({ datasetType }: { datasetType: DatasetTypeEnum }) {
  const type = DATASET_TYPES.find((t) => t.id === datasetType)!

  return (
    <TooltipProvider>
      <Tooltip content="Dataset type cannot be changed after initial selection">
        <div className="flex items-center gap-2">
          <DatasetTypeIcon type={datasetType} />
          <Label size="large">{type.label}</Label>
        </div>
      </Tooltip>
    </TooltipProvider>
  )
}
