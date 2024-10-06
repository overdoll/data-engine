import React from "react"
import { X } from "lucide-react"

interface MergeSidepanelProps {
  isOpen: boolean
  onClose: () => void
  mergeProgress: string[]
  totalProcessed: number
  created: number
  updated: number
  isComplete: boolean
}

const MergeSidepanel: React.FC<MergeSidepanelProps> = ({
  isOpen,
  onClose,
  mergeProgress,
  totalProcessed,
  created,
  updated,
  isComplete,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-[350px] bg-white shadow-lg p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Merge</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>
      <div className="space-y-2">
        {mergeProgress.map((message, index) => (
          <p key={index} className="text-sm text-gray-600">
            {message}
          </p>
        ))}
      </div>
      {isComplete && (
        <div className="mt-4 p-3 bg-green-100 rounded-md">
          <h3 className="font-semibold text-green-800">Merge Complete</h3>
          <p className="text-sm text-green-700">Total Processed: {totalProcessed}</p>
          <p className="text-sm text-green-700">Created: {created}</p>
          <p className="text-sm text-green-700">Updated: {updated}</p>
        </div>
      )}
    </div>
  )
}

export default MergeSidepanel
