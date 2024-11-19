import { create } from 'zustand'

interface MostRecentUploadState {
  fileId: string | null
  setFileId: (id: string | null) => void
}

export const useMostRecentUpload = create<MostRecentUploadState>((set) => ({
  fileId: null,
  setFileId: (id) => set({ fileId: id }),
})) 