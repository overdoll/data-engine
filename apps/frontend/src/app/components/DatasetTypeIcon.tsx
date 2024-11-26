import Buildings from "@/icons/buildings"
import User from "@/icons/user"

type DatasetType = "COMPANY" | "PERSON"

interface DatasetTypeIconProps {
  type: DatasetType
  className?: string
}

export function DatasetTypeIcon({ type, className = "h-4 w-4" }: DatasetTypeIconProps) {
  const icons: Record<DatasetType, React.ComponentType<{ className?: string }>> = {
    COMPANY: Buildings,
    PERSON: User,
  }

  const Icon = icons[type]
  return <Icon className={className} />
} 