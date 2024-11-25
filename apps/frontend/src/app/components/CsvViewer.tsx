import { useCsvData, useCsvMetadata } from "@/utils/api"
import "ag-grid-enterprise"
import { AgGridReact } from "ag-grid-react"
import { ColDef, GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
import { useMemo, useCallback, useRef, useEffect } from "react"
import { useDuplicatesStore } from "@/stores/duplicates"
import { useDeduplicate } from "@/utils/api"
import { useModeStore } from "@/stores/mode"

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

interface RowData {
  id: string
  is_duplicate_of_row_id?: string
  has_duplicates?: boolean
  children?: RowData[]
  [columnId: string]: string | RowData[] | undefined | boolean
}

export function CsvViewer({ fileId }: CsvViewerProps) {
  const { data: csvData, isLoading: isCsvDataLoading, error: csvDataError } = useCsvData(fileId)
  const {
    data: csvMetadata,
    isLoading: isMetadataLoading,
    error: csvMetadataError,
  } = useCsvMetadata(fileId)

  const gridRef = useRef<AgGridReact>(null)
  const { mode } = useModeStore()

  const { mutate: deduplicate } = useDeduplicate(fileId)
  const { setSelectedColumns } = useDuplicatesStore()

  useEffect(() => {
    if (csvMetadata?.columns) {
      const defaultColumns = csvMetadata.columns
        .filter((col) => col.default_deduplicate && col.classification)
        .map((col) => col.id)

      setSelectedColumns(defaultColumns)
      if (defaultColumns.length > 0) {
        deduplicate()
      }
    }
  }, [csvMetadata, deduplicate, setSelectedColumns])

  const columnDefs = useMemo<ColDef<RowData>[]>(() => {
    if (!csvMetadata?.columns) return []

    const sortedColumns = [...csvMetadata.columns].sort((a, b) => {
      if (a.classification && !b.classification) return -1
      if (!a.classification && b.classification) return 1
      return 0
    })

    return sortedColumns.map((col) => ({
      field: col.id,
      headerName: col.label,
      width: calculateColumnWidth(col.label, csvData?.rows.map((row) => row.data[col.id]) || []),
      // cellClass: col.classification ? "classified-column" : undefined,
      headerClass: col.classification ? "classified-header" : undefined,
    }))
  }, [csvMetadata?.columns, csvData?.rows])

  const serverSideDatasource = useCallback(() => {
    return {
      getRows: (params: IServerSideGetRowsParams) => {
        if (!csvData?.rows) {
          params.success({ rowData: [], rowCount: 0 })
          return
        }

        const isShowingDuplicates = useModeStore.getState().mode === "deduplicate"

        if (params.request.groupKeys.length > 0) {
          const rows = csvData.rows
            .filter(
              (row) =>
                row.is_duplicate_of_row_id !== "" &&
                params.request.groupKeys.includes(row.is_duplicate_of_row_id!) &&
                !params.request.groupKeys.includes(row.id)
            )
            .map((row) => ({
              ...row.data,
              id: row.id,
              is_duplicate_of_row_id: row.is_duplicate_of_row_id,
            }))

          params.success({
            rowData: rows,
            rowCount: rows.length,
          })

          return
        }

        if (isShowingDuplicates) {
          // Create a Set of IDs that have duplicates
          const idsWithDuplicates = new Set(
            csvData.rows
              .filter((row) => !!row.is_duplicate_of_row_id)
              .map((row) => row.is_duplicate_of_row_id)
          )

          const rows = csvData.rows
            .filter((row) => !row.is_duplicate_of_row_id)
            .map((row) => ({
              ...row.data,
              id: row.id,
              is_duplicate_of_row_id: undefined,
              has_duplicates: idsWithDuplicates.has(row.id),
            }))
            .sort((a, b) => {
              // Sort by has_duplicates (true first)
              if (a.has_duplicates && !b.has_duplicates) return -1
              if (!a.has_duplicates && b.has_duplicates) return 1
              return 0
            })

          params.success({
            rowData: rows,
            rowCount: rows.length,
          })
          return
        }

        const rows = csvData.rows
          .filter((row) => !row.is_duplicate_of_row_id)
          .map((row) => ({
            ...row.data,
            id: row.id,
            is_duplicate_of_row_id: undefined,
            has_duplicates: false,
          }))

        params.success({
          rowData: rows,
          rowCount: rows.length,
        })
      },
    }
  }, [csvData?.rows])

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      window.gridApi = params.api

      const datasource = serverSideDatasource()
      params.api.setGridOption("serverSideDatasource", datasource)
    },
    [serverSideDatasource]
  )

  if (isCsvDataLoading || isMetadataLoading) {
    return <div className="flex-1 p-4">Loading...</div>
  }

  if (csvDataError || csvMetadataError) {
    return <div className="flex-1 p-4 text-red-500">Error loading CSV data</div>
  }

  if (!csvData || !csvMetadata) return null

  return (
    <div className="flex-1 h-[calc(100vh-79px)] w-full ag-theme-quartz">
      <AgGridReact<RowData>
        ref={gridRef}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: false,
          filter: false,
          resizable: true,
          suppressMovable: true,
        }}
        rowModelType="serverSide"
        domLayout="normal"
        className="h-full w-full"
        onGridReady={onGridReady}
        animateRows={false}
        suppressRowTransform={true}
        enableCellTextSelection={true}
        suppressRowClickSelection={true}
        treeData={mode === "deduplicate"}
        getDataPath={(data: RowData) => {
          return [data.id]
        }}
        autoGroupColumnDef={{
          headerName: "",
          minWidth: 48,
          resizable: false,
          flex: 1,
        }}
        getRowClass={(params) => {
          const classes = []
          if (params.data?.has_duplicates) {
            classes.push("duplicate-parent-row")
          }
          if (params.data?.is_duplicate_of_row_id) {
            classes.push("duplicate-child-row")
          }
          return classes.join(" ")
        }}
        isServerSideGroup={(dataItem) => {
          return dataItem.has_duplicates && mode === "deduplicate"
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
