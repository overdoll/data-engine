import { useCsvData } from "@/utils/api"
import "ag-grid-enterprise"
import { AgGridReact } from "ag-grid-react"
import { ColDef, GridReadyEvent } from "ag-grid-community"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
import { useMemo, useCallback } from "react"
import { useDuplicatesStore } from "@/stores/duplicates"

declare global {
  interface Window {
    gridApi: any
  }
}

interface CsvViewerProps {
  fileId: string
}

function calculateColumnWidth(key: string, values: string[]): number {
  // Get max length of header and all cell values
  const maxContentLength = Math.max(
    key.length + 3,
    ...values.map((v) => (v || "").toString().length)
  )
  // Convert to pixels with some padding
  return Math.min(Math.max(maxContentLength * 10, 100), 300)
}

// Add type for row data
interface RowData {
  [columnId: string]: string
  id: string
  is_duplicate_of_row_id: string
}

export function CsvViewer({ fileId }: CsvViewerProps) {
  const { data, error, isLoading } = useCsvData(fileId)
  const isShowingDuplicates = useDuplicatesStore((state) => state.isShowingDuplicates)

  const columnDefs = useMemo<ColDef<RowData>[]>(() => {
    if (!data?.columns) return []

    // Sort columns so classified ones come first
    const sortedColumns = [...data.columns].sort((a, b) => {
      if (a.classification && !b.classification) return -1
      if (!a.classification && b.classification) return 1
      return 0
    })

    return sortedColumns.map((col) => ({
      field: col.id,
      headerName: col.label,
      width: calculateColumnWidth(
        col.label,
        data.rows.map((row) => row.data[col.id])
      ),
      sortable: true,
      filter: true,
      resizable: true,
      cellClass: col.classification ? "classified-column" : undefined,
      headerClass: col.classification ? "classified-header" : undefined,
    }))
  }, [data?.columns, data?.rows])

  const rowData = useMemo(() => {
    if (!data?.rows) return []
    return data.rows.map((row) => ({
      ...row.data,
      is_duplicate_of_row_id: row.is_duplicate_of_row_id ?? "",
      id: row.id,
    }))
  }, [data?.rows])

  const onGridReady = useCallback((params: GridReadyEvent) => {
    window.gridApi = params.api
  }, [])

  // Update the processedRows logic
  const processedRows = useMemo(() => {
    if (!isShowingDuplicates) return rowData

    const result: (RowData & { children?: RowData[] })[] = []
    const duplicatesMap = new Map<string, RowData[]>()

    // First, group duplicates by their original row id
    rowData.forEach((row) => {
      if (row.is_duplicate_of_row_id) {
        if (!duplicatesMap.has(row.is_duplicate_of_row_id)) {
          duplicatesMap.set(row.is_duplicate_of_row_id, [])
        }
        duplicatesMap.get(row.is_duplicate_of_row_id)?.push(row)
      }
    })

    // Then create the tree structure
    rowData.forEach((row) => {
      if (!row.is_duplicate_of_row_id) {
        const duplicates = duplicatesMap.get(row.id) || []
        if (duplicates.length > 0) {
          result.push({
            ...row,
            children: duplicates,
          } as RowData & { children?: RowData[] })
        } else {
          result.push(row)
        }
      }
    })

    return result
  }, [rowData, isShowingDuplicates])

  if (isLoading) {
    return <div className="flex-1 p-4">Loading...</div>
  }

  if (error) {
    return <div className="flex-1 p-4 text-red-500">Error loading CSV data</div>
  }

  if (!data) return null

  return (
    <div className="flex-1 h-[calc(100vh-79px)] w-full ag-theme-quartz">
      <AgGridReact<RowData>
        columnDefs={columnDefs}
        defaultColDef={{
          resizable: true,
          sortable: true,
          filter: true,
        }}
        rowData={processedRows}
        domLayout="normal"
        className="h-full w-full"
        onGridReady={onGridReady}
        animateRows={true}
        enableCellTextSelection={true}
        suppressRowClickSelection={true}
        gridOptions={{
          treeData: isShowingDuplicates,
          groupDefaultExpanded: -1, // Expand all by default
          autoGroupColumnDef: {
            headerName: "Row",
            minWidth: 200,
            field: "id", // Show the id field in the group column
            cellRendererParams: {
              suppressCount: true,
              // don't render anything, it's just a placeholder
              innerRenderer: () => {
                return ""
              },
            },
          },
        }}
      />
    </div>
  )
}
