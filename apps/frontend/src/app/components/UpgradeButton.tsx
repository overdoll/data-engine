import { Button, ButtonProps } from "@/components/button"
import { Prompt } from "@/components/prompt"
import { Label } from "@/components/label"
import { Textarea } from "@/components/textarea"
import { useState } from "react"
import { useFeatureRequest } from "@/utils/api"
import { toast } from "@/utils/toast"
import { Sparkles } from "lucide-react"

export function UpgradeButton(props: ButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [text, setText] = useState("")
  const { mutateAsync: submitFeatureRequest, isPending } = useFeatureRequest()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await submitFeatureRequest({
      feature_type: "upgrade-request",
      text,
    })

    toast("Request received", {
      description:
        "Thanks for your interest! We'll notify you when premium features are available.",
      duration: 10000,
    })

    setText("")
    setModalOpen(false)
  }

  return (
    <>
      <Button
        variant="secondary"
        size="small"
        className="bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700 hover:text-violet-800 flex items-center gap-2"
        onClick={() => setModalOpen(true)}
        {...props}
      >
        <Sparkles className="w-4 h-4" />
        Upgrade
      </Button>

      <Prompt open={modalOpen} onOpenChange={setModalOpen} variant="confirmation">
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Upgrade to Premium</Prompt.Title>
            <Prompt.Description>
              Get early access to premium features when they launch! Tell us what features you're
              most interested in.
            </Prompt.Description>
          </Prompt.Header>
          <div className="space-y-1 p-6">
            <Label htmlFor="text">What features are you looking for?</Label>
            <Textarea
              id="text"
              placeholder="Tell us what premium features would help you the most..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
            />
          </div>
          <Prompt.Footer>
            <Prompt.Cancel>Cancel</Prompt.Cancel>
            <Prompt.Action disabled={text.length < 3 || isPending} onClick={handleSubmit}>
              Sign up for early access
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </>
  )
}
