import { useCsvData } from "@/utils/api"
import "ag-grid-enterprise"
import { AgGridReact } from "ag-grid-react"
import { ColDef, GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
import { useMemo, useCallback, useRef } from "react"

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

// Update the RowData interface to include optional children
interface RowData {
  [columnId: string]: string | RowData[] | undefined | boolean
  id: string
  is_duplicate_of_row_id?: string
  has_duplicates?: boolean
  children?: RowData[]
}

export function CsvViewer({ fileId }: CsvViewerProps) {
  const { data, error, isLoading } = useCsvData(fileId)
  const gridRef = useRef<AgGridReact>(null)

  const columnDefs = useMemo<ColDef<RowData>[]>(() => {
    if (!data?.columns) return []

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

  const serverSideDatasource = useCallback(() => {
    return {
      getRows: (params: IServerSideGetRowsParams) => {
        if (!data?.rows) {
          params.success({ rowData: [], rowCount: 0 })
          return
        }

        if (params.request.groupKeys.length > 0) {
          const rows = data.rows
            .filter(
              (row) =>
                row.is_duplicate_of_row_id !== "" &&
                params.request.groupKeys.includes(row.is_duplicate_of_row_id!) &&
                !params.request.groupKeys.includes(row.id)
            )
            .map((row) => ({
              ...row.data,
              id: row.id,
              is_duplicate_of_row_id: undefined,
            }))

          params.success({
            rowData: rows,
            rowCount: rows.length,
          })

          return
        }

        // Create a Set of IDs that have duplicates
        const idsWithDuplicates = new Set(
          data.rows
            .filter((row) => !!row.is_duplicate_of_row_id)
            .map((row) => row.is_duplicate_of_row_id)
        )

        const rows = data.rows
          .filter((row) => !row.is_duplicate_of_row_id)
          .map((row) => ({
            ...row.data,
            id: row.id,
            is_duplicate_of_row_id: undefined,
            has_duplicates: idsWithDuplicates.has(row.id),
          }))

        params.success({
          rowData: rows,
          rowCount: rows.length,
        })
      },
    }
  }, [data?.rows])

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      window.gridApi = params.api

      const datasource = serverSideDatasource()
      params.api.setGridOption("serverSideDatasource", datasource)
    },
    [serverSideDatasource]
  )

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
        ref={gridRef}
        columnDefs={columnDefs}
        defaultColDef={{
          resizable: true,
          sortable: true,
          filter: true,
        }}
        rowModelType="serverSide"
        domLayout="normal"
        className="h-full w-full"
        onGridReady={onGridReady}
        animateRows={true}
        enableCellTextSelection={true}
        suppressRowClickSelection={true}
        treeData={true}
        getDataPath={(data: RowData) => {
          return [data.id]
        }}
        getRowClass={(params) => {
          const hasChildren = params.data?.children && params.data.children.length > 0
          return hasChildren ? "has-duplicates" : ""
        }}
        isServerSideGroup={(dataItem) => {
          return dataItem.has_duplicates
        }}
        getServerSideGroupKey={(dataItem) => {
          return dataItem.id
        }}
        cacheBlockSize={100}
        maxBlocksInCache={10}
      />
    </div>
  )
}
