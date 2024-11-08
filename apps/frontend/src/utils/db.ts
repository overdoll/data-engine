interface FileMetadata {
  id: string
  fileName: string
  uploadDate: Date
}

const STORAGE_KEY = "dataset-files"

export function addFile(fileMetadata: FileMetadata): void {
  const existingFiles = getFiles()
  existingFiles.push(fileMetadata)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existingFiles))
}

export function getFiles(): FileMetadata[] {
  const filesJson = localStorage.getItem(STORAGE_KEY)
  if (!filesJson) return []

  const files = JSON.parse(filesJson)
  // Convert string dates back to Date objects
  return files.map((file: any) => ({
    ...file,
    uploadDate: new Date(file.uploadDate),
  }))
}

export function removeFile(id: string): void {
  const files = getFiles()
  const updatedFiles = files.filter((file) => file.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles))
}
