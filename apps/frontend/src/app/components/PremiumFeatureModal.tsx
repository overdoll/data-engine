import { Prompt } from "@/components/prompt"
import { Input } from "@/components/input"
import { Label } from "@/components/label"
import { useState } from "react"

interface PremiumFeatureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName: string
}

export function PremiumFeatureModal({ open, onOpenChange, featureName }: PremiumFeatureModalProps) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Handle email submission to API
    onOpenChange(false)
  }

  return (
    <Prompt open={open} onOpenChange={onOpenChange} variant="confirmation">
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Premium Feature</Prompt.Title>
          <Prompt.Description>
            {featureName} export is a premium feature. Sign up to get early access when it launches!
          </Prompt.Description>
        </Prompt.Header>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </form>
        <Prompt.Footer>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Prompt.Action onClick={handleSubmit}>Sign up for early access</Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}
