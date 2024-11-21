import axios from "axios"
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { addFile, getFile, getFiles } from "./db"
import { nanoid } from "nanoid"

// Default cache settings
const defaultCacheTime = 1000 * 60 * 5 // 5 minutes
const defaultStaleTime = 1000 * 60 * 1 // 1 minute

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: defaultCacheTime,
      staleTime: defaultStaleTime,
      refetchOnWindowFocus: false,
    },
  },
})

// Base API client
const apiClient = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Error type
interface ApiError {
  message: string
  status: number
}

// File types
export interface FileUploadResponse {
  uuid: string
}

export interface CsvData {
  columns: {
    id: string
    label: string
    classification?: string
  }[]
  rows: {
    id: string
    is_duplicate_of_row_id?: string
    data: {
      [columnId: string]: string
    }
  }[]
}

// Update Suggestion type to match API schema
export interface Suggestion {
  classification: string
  column_id: string
  label: string
  description: string
  suggestion_id: string
}

// Query keys
export const queryKeys = {
  files: ["files"] as const,
  file: (id: string) => ["file", id] as const,
  csvData: (id: string) => ["csv-data", id] as const,
  fileMetadata: (id: string) => ["file-metadata", id] as const,
  suggestions: (id: string) => ["suggestions", id] as const,
}

// Queries
export const useFiles = () => {
  return useQuery({
    queryKey: queryKeys.files,
    queryFn: async () => {
      return getFiles()
    },
  })
}

export const useFile = (id: string) => {
  return useQuery({
    queryKey: queryKeys.file(id),
    queryFn: async () => {
      const { data } = await apiClient.get<FileUploadResponse>(`/csv/${id}`)
      return data
    },
  })
}

export const useFileMetadata = (id: string) => {
  return useQuery({
    queryKey: queryKeys.fileMetadata(id),
    queryFn: async () => {
      return getFile(id)
    },
    enabled: !!id,
  })
}

function assignRandomDuplicates(
  rows: CsvData["rows"],
  duplicatePercentage: number = 0.3
): CsvData["rows"] {
  const rowsCopy = [...rows]
  const numDuplicates = Math.floor(rows.length * duplicatePercentage)

  // Randomly select rows to be marked as duplicates
  for (let i = 0; i < numDuplicates; i++) {
    const randomIndex = Math.floor(Math.random() * rowsCopy.length)
    const randomTargetIndex = Math.floor(Math.random() * rowsCopy.length)

    // Don't create self-references or duplicate existing relationships
    if (randomIndex !== randomTargetIndex && !rowsCopy[randomIndex].is_duplicate_of_row_id) {
      rowsCopy[randomIndex].is_duplicate_of_row_id = rowsCopy[randomTargetIndex].id
    }
  }

  return rowsCopy
}

export const useCsvData = (id: string) => {
  return useQuery({
    queryKey: queryKeys.csvData(id),
    queryFn: async () => {
      const { data } = await apiClient.get<CsvData>(`/csv/${id}`)
      // Modify the data to include random duplicates
      return {
        ...data,
        rows: assignRandomDuplicates(data.rows),
      }
    },
    enabled: !!id,
  })
}

// Add new suggestions query
export const useSuggestions = (id?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.suggestions(id!),
    queryFn: async () => {
      const { data } = await apiClient.get<Suggestion[]>(`/csv/${id}/suggestions`)
      return data
    },
    enabled: !!id && enabled,
    retry: false,
  })
}

// Mutations
export const useUploadFile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: FormData) => {
      const { data } = await apiClient.post<FileUploadResponse>("/csv/upload", file, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const fileData = file.get("file")
      if (fileData instanceof File) {
        const sanitizedName = fileData.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()
        const randomId = nanoid(6)
        const friendlyId = `${sanitizedName}-${randomId}`

        const fileMetadata = {
          id: data.uuid,
          fileName: fileData.name,
          uploadDate: new Date(),
          friendlyId,
        }

        // Then save metadata to IndexedDB
        await addFile(fileMetadata)

        return fileMetadata
      }

      throw new Error("No file data found")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] })
    },
  })
}

interface UpdatePayload {
  column_id: string
  action: "classify_column" | "remove_column"
  classification?: string
}

// Add new mutation
export const useApplySuggestion = (fileId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Omit<UpdatePayload, "action">[]) => {
      const { data } = await apiClient.post(`/csv/${fileId}/apply-classifications`, {
        classifications: updates.map((update) => ({ ...update })),
      })
      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.csvData(fileId) })
      window.gridApi?.refreshCells({ force: true })
      await queryClient.invalidateQueries({ queryKey: queryKeys.suggestions(fileId) })
    },
  })
}

// Add new interface for transformation response
export interface Transformation {
  [key: string]: string // Original value -> transformed value mapping
}

// Add new mutation for generating transformations
export const useGenerateTransformation = (fileId: string) => {
  return useMutation({
    mutationFn: async ({ columnId, prompt }: { columnId: string; prompt: string }) => {
      const { data } = await apiClient.post<Transformation>(
        `/csv/${fileId}/generate-column-values`,
        {
          column_id: columnId,
          prompt,
        }
      )
      return data
    },
  })
}

// Add new mutation for applying transformations
export const useApplyTransformations = (fileId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      columnId,
      transformations,
    }: {
      columnId: string
      transformations: Record<string, string>
    }) => {
      const { data } = await apiClient.post(`/csv/${fileId}/update-column-values`, {
        column_id: columnId,
        transformations,
      })
      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.csvData(fileId) })
      window.gridApi?.refreshCells({ force: true })
    },
  })
}

// Error handling interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || "An error occurred",
      status: error.response?.status || 500,
    }
    return Promise.reject(apiError)
  }
)
