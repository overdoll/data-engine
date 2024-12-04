import { Label } from "@/components/label"
import { Tooltip, TooltipProvider } from "@/components/tooltip"
import { DatasetTypeIcon } from "./DatasetTypeIcon"
import { DATASET_TYPES } from "@/utils/dataset-types"
import { DatasetType as DatasetTypeEnum } from "@/utils/api"

export function DatasetType({ datasetType }: { datasetType: DatasetTypeEnum }) {
  const type = DATASET_TYPES.find((t) => t.id === datasetType)!

  return (
    <TooltipProvider>
      <Tooltip
        content={`This dataset type is marked as ${type.label} data. Available fixes and deduplication logic will be applied based on this type. The type cannot be changed after initial selection.`}
      >
        <div className="flex items-center gap-2 px-2 rounded-md opacity-40">
          <DatasetTypeIcon type={datasetType} />
          <Label>{type.label}</Label>
        </div>
      </Tooltip>
    </TooltipProvider>
  )
}
