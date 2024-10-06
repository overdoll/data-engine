"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Upload, Merge, GripVertical, Star } from "lucide-react"
import { useState, useRef } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import MergeSidepanel from "@/components/MergeSidepanel"

interface Dataset {
  uuid: string
  fileName: string
  rowCount: number
  isMaster?: boolean // Add this line
}

const DatasetTab = ({
  dataset,
  isActive,
  onDrop,
  isMergeMode,
}: {
  dataset: Dataset
  isActive: boolean
  onDrop: (sourceUuid: string, targetUuid: string) => void
  isMergeMode: boolean
}) => {
  const dragRef = useRef(null)

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "DATASET",
      item: { uuid: dataset.uuid },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
      canDrag: isMergeMode,
    }),
    [isMergeMode, dataset.uuid]
  )

  const [{ isOver }, drop] = useDrop<{ uuid: string }, void, { isOver: boolean }>(
    () => ({
      accept: "DATASET",
      drop: (item: { uuid: string }) => onDrop(item.uuid, dataset.uuid),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
      canDrop: () => isMergeMode,
    }),
    [isMergeMode, onDrop, dataset.uuid]
  )

  drag(drop(dragRef))

  return (
    <div
      ref={dragRef}
      className={`flex items-center ${isMergeMode ? "cursor-move" : ""} ${
        isDragging ? "opacity-50" : ""
      } ${isOver ? "bg-gray-100" : ""}`}
    >
      {isMergeMode && (
        <div className="mr-2">
          <GripVertical size={16} className="text-gray-400" />
        </div>
      )}
      <Link
        href={`/dataset/${dataset.uuid}`}
        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
          isActive
            ? "border-indigo-500 text-indigo-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
        onClick={(e) => isMergeMode && e.preventDefault()}
      >
        <div className="flex items-center">
          {dataset.fileName}
          {dataset.isMaster && (
            <Star size={16} className="ml-1 text-yellow-400" fill="currentColor" />
          )}
        </div>
      </Link>
    </div>
  )
}

export default function DatasetsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [isUploading, setIsUploading] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [isMergeMode, setIsMergeMode] = useState(false)
  const [mergeProgress, setMergeProgress] = useState<string[]>([])
  const [totalProcessed, setTotalProcessed] = useState(0)
  const [created, setCreated] = useState(0)
  const [updated, setUpdated] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const {
    data: datasets,
    isLoading,
    error,
  } = useQuery<Dataset[]>({
    queryKey: ["datasets"],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/datasets`)
      if (!response.ok) {
        throw new Error("Failed to fetch datasets")
      }
      const data = await response.json()
      // Sort the datasets to put master datasets at the front
      return data.sort((a: Dataset, b: Dataset) => {
        if (a.isMaster && !b.isMaster) return -1
        if (!a.isMaster && b.isMaster) return 1
        return 0
      })
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", file.name)
      formData.append("isMaster", "false")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dataset/initialize-load`,
        {
          method: "POST",
          body: formData,
        }
      )
      if (!response.ok) {
        throw new Error("Failed to upload dataset")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] })
    },
  })

  const handleMerge = async (sourceUuid: string, targetUuid: string) => {
    setIsMerging(true)
    setMergeProgress([`Starting merge of dataset ${sourceUuid} into ${targetUuid}`])
    setTotalProcessed(0)
    setCreated(0)
    setUpdated(0)
    setIsComplete(false)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dataset/${sourceUuid}/load/${targetUuid}`,
        {
          method: "GET",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to merge datasets")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to get response reader")
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        const events = text.split("\n\n")

        for (const event of events) {
          if (event.trim() === "") continue
          const data = JSON.parse(event.replace("data: ", ""))

          if (data.type === "progress") {
            setTotalProcessed(data.totalProcessed)
            setCreated(data.created)
            setUpdated(data.updated)
            setMergeProgress(() => [
              `Processed: ${data.totalProcessed}, Created: ${data.created}, Updated: ${data.updated}`,
            ])
          } else if (data.type === "complete") {
            setIsComplete(true)
            setMergeProgress((prev) => [...prev, "Merge completed successfully"])
          }
        }
      }

      // Invalidate and refetch the datasets query after successful merge
      queryClient.invalidateQueries({ queryKey: ["datasets"] })
    } catch (error) {
      console.error("Error merging datasets:", error)
      setMergeProgress((prev) => [...prev, "Error occurred during merge"])
    } finally {
      setIsMerging(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      try {
        await uploadMutation.mutateAsync(file)
      } catch (error) {
        console.error("Error uploading file:", error)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const toggleMergeMode = () => {
    setIsMergeMode((prev) => !prev)
    if (!isMergeMode) {
      setMergeProgress([])
    }
  }

  if (isLoading) return <div>Loading datasets...</div>
  if (error) return <div className="text-red-500">Error loading datasets</div>

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`${isMergeMode ? "mr-[350px]" : ""}`}>
        <div className="mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Datasets</h1>
            <div className="flex space-x-2">
              <label
                className={`flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                  isUploading || isMergeMode
                    ? "border-gray-300 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 cursor-pointer"
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading || isMergeMode}
                />
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload"}
              </label>
              <button
                onClick={toggleMergeMode}
                className={`flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isMerging
                    ? "bg-blue-400 text-white cursor-not-allowed"
                    : isMergeMode
                      ? "bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                }`}
                disabled={isMerging}
              >
                <Merge className="w-4 h-4 mr-2" />
                {isMerging ? "Merging..." : isMergeMode ? "Close Merge" : "Merge"}
              </button>
            </div>
          </div>
          <div className="mb-4 border-b flex items-center justify-between">
            <nav className="-mb-px flex space-x-8">
              {datasets?.map((dataset) => (
                <DatasetTab
                  key={dataset.uuid}
                  dataset={dataset}
                  isActive={pathname === `/dataset/${dataset.uuid}`}
                  onDrop={(sourceUuid) => handleMerge(sourceUuid, dataset.uuid)}
                  isMergeMode={isMergeMode}
                />
              ))}
            </nav>
          </div>
          {children}
        </div>
      </div>
      <MergeSidepanel
        isOpen={isMergeMode}
        onClose={toggleMergeMode}
        mergeProgress={mergeProgress}
        totalProcessed={totalProcessed}
        created={created}
        updated={updated}
        isComplete={isComplete}
      />
    </DndProvider>
  )
}
