import axios from "axios"
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { addFile, getFiles } from "./db"
import { useDuplicatesStore } from "../stores/duplicates"

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

export type DatasetType = "PERSON" | "COMPANY"

// File types
export interface FileUploadResponse {
  uuid: string
  metadata: {
    original_filename: string
    dataset_type: DatasetType
  }
}

export interface CsvRowsData {
  rows: {
    id: string
    is_duplicate_of_row_id?: string
    data: {
      [columnId: string]: string
    }
  }[]
}

export interface CsvColumn {
  id: string
  label: string
  classification?: string
  default_deduplicate?: boolean
}

export interface CsvMetadata {
  columns: CsvColumn[]
  metadata: {
    id: string
    original_filename: string
    dataset_type: DatasetType
  }
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
  csvMetadata: (id: string) => ["csv-metadata", id] as const,
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

export const useCsvData = (id: string) => {
  return useQuery({
    queryKey: queryKeys.csvData(id),
    queryFn: async () => {
      const { data } = await apiClient.get<CsvRowsData>(`/csv/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export const useCsvMetadata = (id: string) => {
  return useQuery({
    queryKey: queryKeys.csvMetadata(id),
    queryFn: async () => {
      const { data } = await apiClient.get<CsvMetadata>(`/csv/${id}/metadata`)
      return { ...data, metadata: { ...data.metadata, id } }
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
        const fileMetadata = {
          id: data.uuid,
          fileName: data.metadata.original_filename,
          uploadDate: new Date(),
          type: data.metadata.dataset_type,
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.csvMetadata(fileId) })
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
export const useGenerateColumnValues = (fileId: string) => {
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
export const useUpdateColumnValues = (fileId: string) => {
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

// Update DeduplicationResponse interface to match backend
export interface DeduplicationResponse {
  rows: {
    id: string
    data: { [key: string]: string }
    is_duplicate_of: string | null
  }[]
  original_count: number
  deduplicated_count: number
}

// Update the deduplication mutation
export const useDeduplicate = (fileId: string) => {
  const queryClient = useQueryClient()
  const setDuplicateRows = useDuplicatesStore((state) => state.setDuplicateRows)

  return useMutation({
    mutationFn: async (columnIds: string[]) => {
      const { data } = await apiClient.post<DeduplicationResponse>(`/csv/${fileId}/deduplicate`, {
        column_ids: columnIds,
      })
      return data
    },
    onSuccess: async (data) => {
      if (!data) return

      // Create a map of original rows to their duplicates
      const duplicateMap: Record<string, string[]> = {}
      data.rows.forEach((row) => {
        if (row.is_duplicate_of) {
          if (!duplicateMap[row.is_duplicate_of]) {
            duplicateMap[row.is_duplicate_of] = []
          }
          duplicateMap[row.is_duplicate_of].push(row.id)
        }
      })

      // Store the duplicate mapping
      setDuplicateRows(duplicateMap)

      // Update the cache with the new rows that include duplicate information
      queryClient.setQueryData(queryKeys.csvData(fileId), { rows: data.rows })
      window.gridApi?.refreshCells({ force: true })
    },
  })
}

// Add interface for dataset type update request/response
export interface UpdateDatasetTypeResponse {
  success: boolean
  dataset_type: DatasetType
}

// Add mutation for updating dataset type
export const useUpdateDatasetType = (fileId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (datasetType: DatasetType) => {
      const { data } = await apiClient.post<UpdateDatasetTypeResponse>(
        `/csv/${fileId}/update-dataset-type`,
        {
          dataset_type: datasetType,
        }
      )
      return data
    },
    onSuccess: async () => {
      // Invalidate and refetch relevant queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.csvMetadata(fileId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.files })
      await queryClient.invalidateQueries({ queryKey: queryKeys.suggestions(fileId) })
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
