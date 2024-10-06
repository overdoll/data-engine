"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Upload } from "lucide-react"
import { useState } from "react"

interface Dataset {
  uuid: string
  fileName: string
  rowCount: number
}

export default function DatasetsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [isUploading, setIsUploading] = useState(false)

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
      return response.json()
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
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

  if (isLoading) return <div>Loading datasets...</div>
  if (error) return <div className="text-red-500">Error loading datasets</div>

  return (
    <div className="mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Datasets</h1>
      <div className="mb-4 border-b flex items-center justify-between">
        <nav className="-mb-px flex space-x-8">
          {datasets?.map((dataset) => (
            <Link
              key={dataset.uuid}
              href={`/dataset/${dataset.uuid}`}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                pathname === `/dataset/${dataset.uuid}`
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {dataset.fileName}
            </Link>
          ))}
        </nav>
        <label
          className={`flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
            isUploading
              ? "border-gray-300 text-gray-400 cursor-not-allowed"
              : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 cursor-pointer"
          }`}
        >
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Uploading..." : "Upload"}
        </label>
      </div>
      {children}
    </div>
  )
}
