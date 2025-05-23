import { CsvRowsData, useCsvData, useCsvMetadata } from "@/utils/api"
import "ag-grid-enterprise"
import { AgGridReact } from "ag-grid-react"
import { ColDef, GridReadyEvent, IServerSideGetRowsParams } from "ag-grid-community"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
import { useMemo, useCallback, useRef } from "react"
import { useDuplicatesStore } from "@/stores/duplicates"
import { useModeStore } from "@/stores/mode"
import { TableSectionSkeleton } from "@/components/skeleton"
import { useQueryClient } from "@tanstack/react-query"

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
  const queryClient = useQueryClient()
  const { data: csvData, isLoading: isCsvDataLoading, error: csvDataError } = useCsvData(fileId)
  const {
    data: csvMetadata,
    isLoading: isMetadataLoading,
    error: csvMetadataError,
  } = useCsvMetadata(fileId)

  const gridRef = useRef<AgGridReact>(null)
  const { mode } = useModeStore()
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
      cellClass: ["ph-no-capture", col.classification ? "classified-column" : ""].filter(Boolean),
      headerClass: ["ph-no-capture", col.classification ? "classified-header" : ""].filter(Boolean),
    }))
  }, [csvMetadata?.columns, csvData?.rows])

  const serverSideDatasource = useCallback(() => {
    return {
      getRows: (params: IServerSideGetRowsParams) => {
        const csvData = queryClient.getQueryData<CsvRowsData>(["csv-data", fileId])
        if (!csvData?.rows) {
          params.success({ rowData: [], rowCount: 0 })
          return
        }

        const duplicateRows = useDuplicatesStore.getState().duplicateRows
        const isShowingDuplicates = useModeStore.getState().mode === "deduplicate"

        const allDuplicateRows = Object.values(duplicateRows).flat()

        if (params.request.groupKeys.length > 0) {
          const parentId = params.request.groupKeys[0]
          const duplicateIds = duplicateRows[parentId] || []

          const rows = csvData.rows
            .filter((row) => duplicateIds.includes(row.id))
            .map((row) => ({
              ...row.data,
              id: row.id,
              is_duplicate_of_row_id: parentId,
            }))

          params.success({
            rowData: rows,
            rowCount: rows.length,
          })
          return
        }

        if (isShowingDuplicates) {
          const rows = csvData.rows
            .filter((row) => !allDuplicateRows.includes(row.id))
            .map((row) => ({
              ...row.data,
              id: row.id,
              is_duplicate_of_row_id: undefined,
              has_duplicates: !!duplicateRows[row.id]?.length,
            }))
            .sort((a, b) => {
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

        // Regular view (no duplicates)
        const rows = csvData.rows
          .filter((row) => !allDuplicateRows.includes(row.id))
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
        return
      },
    }
  }, [fileId, queryClient])

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      window.gridApi = params.api
      const datasource = serverSideDatasource()
      params.api.setGridOption("serverSideDatasource", datasource)
    },
    [serverSideDatasource]
  )

  if (isCsvDataLoading || isMetadataLoading) {
    return <TableSectionSkeleton layout="fit" />
  }

  if (csvDataError || csvMetadataError) {
    return <div className="flex-1 p-4 text-red-500">Error loading CSV data</div>
  }

  if (!csvData || !csvMetadata) return null

  return (
    <div
      className="flex-1 h-[calc(100vh-79px)] w-full ag-theme-quartz"
      style={{
        // @ts-expect-error this is valid css
        "--ag-header-background-color": "rgba(250,250,250,1)", // Light gray example
      }}
    >
      <AgGridReact<RowData>
        ref={gridRef}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: false,
          filter: false,
          resizable: true,
          suppressMovable: true,
          suppressMenu: true,
          menuTabs: [],
        }}
        suppressContextMenu={true}
        suppressMenuHide={true}
        rowModelType="serverSide"
        gridOptions={{
          headerHeight: 52,
        }}
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
          headerName: "Unique ID",
          minWidth: 48,
          resizable: false,
          flex: 1,
          headerComponent: () => null,
          cellClass: "ph-no-capture",
        }}
        getRowClass={(params) => {
          const classes = ["ph-no-capture"]
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
