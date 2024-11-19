"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { CustomTransformationModal } from "./CustomTransformationModal"
import { Label } from "@/components/label"
import { useApplyTransformations } from "@/utils/api"

export function CustomTransformation({ fileId }: { fileId: string }) {
  const [open, setOpen] = useState(false)
  const applyTransformations = useApplyTransformations(fileId)

  const handleSubmit = async (data: {
    description: string
    columnId: string
    transformations: Record<string, string>
  }) => {
    try {
      await applyTransformations.mutateAsync({
        columnId: data.columnId,
        transformations: data.transformations,
      })
      setOpen(false)
    } catch (error) {
      console.error("Failed to apply transformations:", error)
    }
  }

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="py-3 px-3 border border-dashed rounded-md flex gap-2 cursor-pointer hover:bg-gray-50"
      >
        <div className="flex items-start pt-1">
          <Plus className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <Label className="font-medium mb-1">Apply custom fix</Label>
          <p className="text-xs text-gray-600">No fixes available? Define your own!</p>
        </div>
      </div>
      <CustomTransformationModal
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        fileId={fileId}
        isApplying={applyTransformations.isPending}
      />
    </>
  )
}
