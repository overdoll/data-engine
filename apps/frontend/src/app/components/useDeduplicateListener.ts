import { useEffect } from "react"
import { useCsvMetadata, useDeduplicate } from "@/utils/api"
import { useDuplicatesStore } from "@/stores/duplicates"
import { useModeStore } from "@/stores/mode"

export function useDeduplicateListener(fileId: string) {
  const { mutateAsync: deduplicate, isPending } = useDeduplicate(fileId)
  const { mode } = useModeStore()
  const {
    setSelectedColumns,
    selectedColumns,
    setIsDeduplicating,
    setStats,
    setError,
    setDuplicateRows,
  } = useDuplicatesStore()
  const { data: csvMetadata } = useCsvMetadata(fileId)

  useEffect(() => {
    if (csvMetadata?.columns) {
      const defaultColumns = csvMetadata.columns
        .filter((col) => col.default_deduplicate && col.classification)
        .map((col) => col.id)

      setSelectedColumns(defaultColumns)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array ensures this only runs once

  useEffect(() => {
    setIsDeduplicating(isPending)
  }, [isPending, setIsDeduplicating])

  useEffect(() => {
    window.gridApi?.refreshCells({ force: true })
    window.gridApi?.refreshServerSide()
  }, [mode])

  useEffect(() => {
    async function handleDeduplicate() {
      if (selectedColumns.length === 0) {
        setError("SELECT_COLUMNS")
        return
      }

      const stats = await deduplicate(selectedColumns)

      if (stats.error) {
        setError(stats.error)
        return
      }

      setError(null)

      setStats({
        duplicateRows: stats.deduplicated_count,
        totalRows: stats.original_count,
      })

      console.log(stats.rows)

      // Create a map of original rows to their duplicates
      const duplicateMap: Record<string, string[]> = {}
      stats.rows.forEach((row) => {
        if (row.is_duplicate_of) {
          if (!duplicateMap[row.is_duplicate_of]) {
            duplicateMap[row.is_duplicate_of] = []
          }
          duplicateMap[row.is_duplicate_of].push(row.id)
        }
      })

      // Store the duplicate mapping
      setDuplicateRows(duplicateMap)

      window.gridApi?.refreshCells({ force: true })
      window.gridApi?.refreshServerSide()
    }

    handleDeduplicate()
  }, [selectedColumns, deduplicate, setStats, setError, setDuplicateRows])
}
