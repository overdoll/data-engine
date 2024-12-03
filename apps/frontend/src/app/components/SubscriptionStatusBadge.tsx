import { Badge } from "@/components/badge"
import { useUser } from "@clerk/nextjs"
import { UpgradeButton } from "./UpgradeButton"

export function SubscriptionStatusBadge() {
  const { user } = useUser()
  const isPaid = user?.publicMetadata?.is_paid

  if (!isPaid) {
    return <UpgradeButton />
  }

  return <Badge color="green">Premium</Badge>
}
