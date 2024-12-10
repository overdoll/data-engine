"use client"

import { Prompt } from "@/components/prompt"
import { Input } from "@/components/input"
import { Label } from "@/components/label"
import { Textarea } from "@/components/textarea"
import { useUser } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@/utils/toast"
import { useSendMessage } from "@/utils/api"

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
})

type FormData = z.infer<typeof formSchema>

interface ContactModalProps {
  isOpen: boolean
  onClose: VoidFunction
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const { user, isLoaded } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: sendMessage } = useSendMessage()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      message: "",
    },
  })

  // Update email when user data is loaded
  useEffect(() => {
    if (isLoaded && user?.primaryEmailAddress?.emailAddress) {
      setValue("email", user.primaryEmailAddress.emailAddress)
    }
  }, [isLoaded, user, setValue])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await sendMessage({
        title: "Sales Contact Request",
        description: `Contact request from ${data.email}`,
        customerMessage: data.message,
      })
      toast.success("Message sent successfully", {
        description: "We'll be in touch with you shortly!",
      })
      reset()
      onClose()
    } catch {
      toast.error("Failed to send message", {
        description: "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Prompt open={isOpen} variant="confirmation">
      <Prompt.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Prompt.Header>
            <Prompt.Title>Contact Us</Prompt.Title>
            <Prompt.Description>
              Tell us a bit about what you need and we&apos;ll get back to you soon.
            </Prompt.Description>
          </Prompt.Header>
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="What are you looking for?"
                {...register("message")}
                className={errors.message ? "border-red-500" : ""}
              />
              {errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
            </div>
          </div>
          <Prompt.Footer>
            <Prompt.Cancel onClick={onClose}>Cancel</Prompt.Cancel>
            <Prompt.Action type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Message"}
            </Prompt.Action>
          </Prompt.Footer>
        </form>
      </Prompt.Content>
    </Prompt>
  )
}
