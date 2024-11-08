import axios from "axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { addFile, getFiles } from "./db"

// Base API client
const apiClient = axios.create({
  baseURL: "/api",
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
  id: string
  url: string
}

// Query keys
export const queryKeys = {
  files: ["files"] as const,
  file: (id: string) => ["file", id] as const,
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
      const { data } = await apiClient.get<FileUploadResponse>(`/files/${id}/`)
      return data
    },
  })
}

// Mutations
export const useUploadFile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: FormData) => {
      const { data } = await apiClient.post<FileUploadResponse>("/files/upload/", file, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      // Then save metadata to IndexedDB
      await addFile({
        id: data.id,
        fileName: file.get("file").name,
        uploadDate: new Date(),
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] })
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
