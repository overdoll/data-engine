import { useEffect } from "react"
import { useCsvMetadata, useDeduplicate } from "@/utils/api"
import { useDuplicatesStore } from "@/stores/duplicates"

export function useDeduplicateListener(fileId: string) {
  const { mutateAsync: deduplicate, isPending } = useDeduplicate(fileId)
  const { setSelectedColumns, selectedColumns, setIsDeduplicating, setStats } = useDuplicatesStore()
  const { data: csvMetadata } = useCsvMetadata(fileId)

  useEffect(() => {
    if (csvMetadata?.columns) {
      const defaultColumns = csvMetadata.columns
        .filter((col) => col.default_deduplicate && col.classification)
        .map((col) => col.id)

      setSelectedColumns(defaultColumns)
    }
  }, [csvMetadata, setSelectedColumns])

  useEffect(() => {
    setIsDeduplicating(isPending)
  }, [isPending, setIsDeduplicating])

  useEffect(() => {
    async function handleDeduplicate() {
      if (selectedColumns.length > 0) {
        const stats = await deduplicate(selectedColumns)
        setStats({
          duplicateRows: stats.deduplicated_count,
          totalRows: stats.original_count,
        })
      }
    }

    handleDeduplicate()
  }, [selectedColumns, deduplicate, setStats])
}
