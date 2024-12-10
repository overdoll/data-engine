import { useRouter } from "next/navigation"
import { toast } from "@/utils/toast"
import axios from "axios"

export const useNotFoundHandler = () => {
  const router = useRouter()

  return (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      toast.error("File not found", {
        id: "file-not-found",
        description: "The requested file could not be found.",
      })
      router.push("/files")
    }
    throw error
  }
}
