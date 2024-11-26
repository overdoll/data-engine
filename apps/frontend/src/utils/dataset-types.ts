import { DatasetType } from "@/utils/api"

export const DATASET_TYPES: Array<{
  id: DatasetType
  label: string
}> = [
  {
    id: "PERSON",
    label: "Contacts",
  },
  {
    id: "COMPANY",
    label: "Companies",
  },
] as const
