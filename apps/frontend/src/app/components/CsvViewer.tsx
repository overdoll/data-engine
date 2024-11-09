import { useCsvData } from "@/utils/api"
import { AgGridReact } from "ag-grid-react"
import { ColDef } from "ag-grid-community"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-alpine.css"
import { useMemo } from "react"

interface CsvViewerProps {
  fileId: string
}
function calculateColumnWidth(key: string, values: string[]): number {
  // Get max length of header and all cell values
  const maxContentLength = Math.max(key.length, ...values.map((v) => (v || "").toString().length))
  // Convert to pixels with some padding
  return Math.min(Math.max(maxContentLength * 10, 100), 300)
}

export function CsvViewer({ fileId }: CsvViewerProps) {
  const { data, error, isLoading } = useCsvData(fileId)

  const columnDefs = useMemo<ColDef<{ [columnId: string]: string }>[]>(() => {
    if (!data?.columns) return []
    return data.columns.map((col) => ({
      field: col.id,
      headerName: col.label,
      width: calculateColumnWidth(
        col.label,
        data.rows.map((row) => row.data[col.id])
      ),
      sortable: true,
      filter: true,
      resizable: true,
    }))
  }, [data?.columns, data?.rows])

  const rowData = useMemo(() => {
    if (!data?.rows) return []
    return data.rows.map((row) => ({
      ...row.data,
      id: row.id,
    }))
  }, [data?.rows])

  if (isLoading) {
    return <div className="flex-1 p-4">Loading...</div>
  }

  if (error) {
    return <div className="flex-1 p-4 text-red-500">Error loading CSV data</div>
  }

  if (!data) return null

  return (
    <div className="flex-1 h-[calc(100vh-79px)] w-full ag-theme-alpine">
      <AgGridReact<{ [columnId: string]: string }>
        columnDefs={columnDefs}
        rowData={rowData}
        defaultColDef={{
          resizable: true,
          sortable: true,
          filter: false,
        }}
        paginationPageSize={15}
        pagination={true}
        paginationAutoPageSize={true}
        domLayout="normal"
        className="h-full w-full"
      />
    </div>
  )
}
