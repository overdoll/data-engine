import { Badge } from "@/components/badge"
import { useUser } from "@clerk/nextjs"
import { UpgradeButton } from "./UpgradeButton"
import { Sparkles } from "lucide-react"

export function SubscriptionStatusBadge() {
  const { user } = useUser()
  const isPaid = user?.publicMetadata?.is_paid

  if (!isPaid) {
    return <UpgradeButton />
  }

  return (
    <Badge className="bg-violet-50 border-violet-200 text-violet-700 flex items-center gap-2">
      <Sparkles className="w-4 h-4 stroke-violet-700 " />
      Premium
    </Badge>
  )
}
