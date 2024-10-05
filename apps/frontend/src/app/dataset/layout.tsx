"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface Dataset {
  uuid: string
  fileName: string
  rowCount: number
}

export default function DatasetsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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

  if (isLoading) return <div>Loading datasets...</div>
  if (error) return <div className="text-red-500">Error loading datasets</div>

  return (
    <div className="mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Datasets</h1>
      <div className="mb-4 border-b">
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
      </div>
      {children}
    </div>
  )
}
