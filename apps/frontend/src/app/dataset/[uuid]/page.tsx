"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"

const useDataset = (uuid: string) => {
  return useQuery({
    queryKey: ["dataset", uuid],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dataset/${uuid}`)
      if (!response.ok) {
        throw new Error("Failed to fetch dataset")
      }
      return response.json()
    },
  })
}

export default function Dataset({ params }: { params: { uuid: string } }) {
  const { uuid } = params
  const { data, isLoading, error } = useDataset(uuid)

  if (isLoading) {
    return <div className="p-4">Loading dataset...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dataset: {uuid}</h1>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
