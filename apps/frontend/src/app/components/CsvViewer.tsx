import { useCsvData } from "@/utils/api"
import { AgGridReact } from "ag-grid-react"
import { ColDef, GridReadyEvent, IDatasource } from "ag-grid-community"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-alpine.css"
import { useMemo, useCallback } from "react"

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
      cellClass: col.classification ? "classified-column" : undefined,
      headerClass: col.classification ? "classified-header" : undefined,
    }))
  }, [data?.columns, data?.rows])

  const rowData = useMemo(() => {
    if (!data?.rows) return []
    return data.rows.map((row) => ({
      ...row.data,
      id: row.id,
    }))
  }, [data?.rows])

  const dataSource: IDatasource = useMemo(() => {
    return {
      rowCount: undefined,
      getRows: (params) => {
        const startRow = params.startRow
        const endRow = params.endRow

        // Get a slice of the data for the requested range
        const rowsThisBlock = rowData.slice(startRow, endRow)
        const lastRow = rowData.length

        // Return the rows to the grid
        setTimeout(() => {
          params.successCallback(rowsThisBlock, lastRow)
        }, 500)
      },
    }
  }, [rowData])

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      window.gridApi = params.api
      params.api.sizeColumnsToFit()

      // Set the datasource after the grid is ready
      if (data?.rows) {
        params.api.setDatasource(dataSource)
      }
    },
    [data?.rows, dataSource]
  )

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
        defaultColDef={{
          resizable: true,
          sortable: true,
          filter: true,
        }}
        rowModelType="infinite"
        cacheBlockSize={100}
        cacheOverflowSize={2}
        maxConcurrentDatasourceRequests={1}
        infiniteInitialRowCount={1000}
        maxBlocksInCache={10}
        domLayout="normal"
        className="h-full w-full"
        onGridReady={onGridReady}
        animateRows={true}
        enableCellTextSelection={true}
        suppressRowClickSelection={true}
      />
    </div>
  )
}
