import axios from "axios"
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/nextjs"
import { useNotFoundHandler } from "@/utils/useNotFoundHandler"

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

const useApiClient = () => {
  const { getToken } = useAuth()

  return async () => {
    const token = await getToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers,
    })
  }
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

export type Metadata = {
  uuid: string
  original_filename: string
  dataset_type: DatasetType
  created_at: string | null
}

export interface CsvMetadata {
  columns: CsvColumn[]
  metadata: Metadata
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
  const apiClient = useApiClient()
  return useQuery({
    queryKey: queryKeys.files,
    queryFn: async () => {
      const client = await apiClient()
      const { data } = await client.get<Metadata[]>("/list-csv")
      return data
    },
  })
}

export const useFile = (id: string) => {
  const apiClient = useApiClient()
  const handleNotFound = useNotFoundHandler()

  return useQuery({
    queryKey: queryKeys.file(id),
    queryFn: async () => {
      try {
        const client = await apiClient()
        const { data } = await client.get<FileUploadResponse>(`/csv/${id}`)
        return data
      } catch (error) {
        return handleNotFound(error)
      }
    },
  })
}

export const useCsvData = (id: string) => {
  const apiClient = useApiClient()
  const handleNotFound = useNotFoundHandler()

  return useQuery({
    queryKey: queryKeys.csvData(id),
    queryFn: async () => {
      try {
        const client = await apiClient()
        const { data } = await client.get<CsvRowsData>(`/csv/${id}`)
        return data
      } catch (error) {
        return handleNotFound(error)
      }
    },
    enabled: !!id,
  })
}

export const useCsvMetadata = (id: string) => {
  const apiClient = useApiClient()
  const handleNotFound = useNotFoundHandler()

  return useQuery({
    queryKey: queryKeys.csvMetadata(id),
    queryFn: async () => {
      try {
        const client = await apiClient()
        const { data } = await client.get<CsvMetadata>(`/csv/${id}/metadata`)
        return { ...data, metadata: { ...data.metadata, id } }
      } catch (error) {
        return handleNotFound(error)
      }
    },
    enabled: !!id,
  })
}

// Add new suggestions query
export const useSuggestions = (id?: string, enabled: boolean = true) => {
  const apiClient = useApiClient()
  const handleNotFound = useNotFoundHandler()

  return useQuery({
    queryKey: queryKeys.suggestions(id!),
    queryFn: async () => {
      try {
        const client = await apiClient()
        const { data } = await client.get<Suggestion[]>(`/csv/${id}/suggestions`)
        return data
      } catch (error) {
        return handleNotFound(error)
      }
    },
    enabled: !!id && enabled,
    retry: false,
  })
}

// Mutations
export const useUploadFile = () => {
  const queryClient = useQueryClient()
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: async (file: FormData) => {
      const client = await apiClient()
      const { data } = await client.post<FileUploadResponse>("/upload-csv", file, {
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
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: async (updates: Omit<UpdatePayload, "action">[]) => {
      const client = await apiClient()
      const { data } = await client.post(`/csv/${fileId}/apply-classifications`, {
        classifications: updates.map((update) => ({ ...update })),
      })
      return data
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.csvData(fileId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.csvMetadata(fileId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.suggestions(fileId) }),
        queryClient.refetchQueries({ queryKey: queryKeys.csvData(fileId) }),
        queryClient.refetchQueries({ queryKey: queryKeys.csvMetadata(fileId) }),
        queryClient.refetchQueries({ queryKey: queryKeys.suggestions(fileId) }),
      ])
      window.gridApi?.refreshCells({ force: true })
      window.gridApi?.refreshServerSide()
    },
  })
}

// Add new interface for transformation response
export interface Transformation {
  [key: string]: string // Original value -> transformed value mapping
}

// Add new mutation for generating transformations
export const useGenerateColumnValues = (fileId: string) => {
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: async ({ columnId, prompt }: { columnId: string; prompt: string }) => {
      const client = await apiClient()
      const { data } = await client.post<Transformation>(`/csv/${fileId}/generate-column-values`, {
        column_id: columnId,
        prompt,
      })
      return data
    },
  })
}

// Add new mutation for applying transformations
export const useUpdateColumnValues = (fileId: string) => {
  const queryClient = useQueryClient()
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: async ({
      columnId,
      transformations,
    }: {
      columnId: string
      transformations: Record<string, string>
    }) => {
      const client = await apiClient()
      const { data } = await client.post(`/csv/${fileId}/update-column-values`, {
        column_id: columnId,
        transformations,
      })
      return data
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.csvData(fileId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.csvMetadata(fileId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.suggestions(fileId) }),
        queryClient.refetchQueries({ queryKey: queryKeys.csvData(fileId) }),
        queryClient.refetchQueries({ queryKey: queryKeys.csvMetadata(fileId) }),
        queryClient.refetchQueries({ queryKey: queryKeys.suggestions(fileId) }),
      ])
      window.gridApi?.refreshCells({ force: true })
      window.gridApi?.refreshServerSide()
    },
  })
}

// Update DeduplicationResponse interface to match backend
export interface DeduplicationResponse {
  rows: {
    id: string
    is_duplicate_of: string | null
  }[]
  original_count: number
  deduplicated_count: number
  error?: "NO_MATCHING_RULES" | "SELECT_COLUMNS" | "NO_MATCHES"
}

// Update the deduplication mutation
export const useDeduplicate = (fileId: string) => {
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: async (columnIds: string[]) => {
      const client = await apiClient()
      const { data } = await client.post<DeduplicationResponse>(`/csv/${fileId}/deduplicate`, {
        column_ids: columnIds,
      })
      return data
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
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: async (datasetType: DatasetType) => {
      const client = await apiClient()
      const { data } = await client.post<UpdateDatasetTypeResponse>(
        `/csv/${fileId}/update-dataset-type`,
        {
          dataset_type: datasetType,
        }
      )
      return data
    },
    onSuccess: async () => {
      // Invalidate and refetch relevant queries
      await queryClient.refetchQueries({ queryKey: queryKeys.csvMetadata(fileId) })
      await queryClient.refetchQueries({ queryKey: queryKeys.files })
      await queryClient.refetchQueries({ queryKey: queryKeys.suggestions(fileId) })
    },
  })
}

export const useSendMessage = () => {
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: async (data: { title: string; description?: string; customerMessage?: string }) => {
      const client = await apiClient()
      const { data: response } = await client.post("/message", {
        title: data.title,
        description: data.description,
        customer_message: data.customerMessage,
      })
      return response
    },
  })
}
