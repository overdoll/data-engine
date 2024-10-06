"use client"

import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { AgGridReact } from "ag-grid-react"
import { ColDef } from "ag-grid-community"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-alpine.css"
import { Button } from "@/components/ui/button"
import { Wand2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ParsedColumn = {
  columnName: string
  // Add other properties if needed
  parseType: string
}

const useDataset = (uuid: string) => {
  const queryFn = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dataset/${uuid}`)
    if (!response.ok) {
      throw new Error("Failed to fetch dataset")
    }
    return response.json()
  }

  const query = useQuery({
    queryKey: ["dataset", uuid],
    queryFn,
  })

  return {
    ...query,
    refetch: query.refetch,
  }
}

const useSuggestions = (uuid: string) => {
  const queryFn = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/dataset/${uuid}/suggest-parse-columns`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch suggestions")
    }
    return response.json()
  }

  return useQuery({
    queryKey: ["suggestions", uuid],
    queryFn,
    staleTime: Infinity,
    enabled: false, // Don't run the query automatically
  })
}

const parseColumn = async (uuid: string, columnName: string, parseType: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/dataset/${uuid}/parse-column`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ columnName, parseType }),
    }
  )

  if (!response.ok) {
    throw new Error("Failed to parse column")
  }

  return response.json()
}

const calculateColumnWidth = (key: string, data: any[]): number => {
  const maxContentLength = Math.max(key.length, ...data.map((row) => String(row[key]).length))
  return Math.min(Math.max(maxContentLength * 8, 100), 300) + 50
}

const CustomHeader = (props: any) => {
  const [isLoading, setIsLoading] = useState(false)
  const suggestion = props?.context?.suggestions?.columns?.find(
    (column: any) => column.columnName === props.column.getColId()
  )

  const onParseClick = async () => {
    setIsLoading(true)
    try {
      await parseColumn(props.context.uuid, props.column.getColId(), suggestion.parseType)
      await Promise.all([props.context.refetchData(), props.context.refetchParsedColumns()])
    } catch (error) {
      console.error("Error parsing column:", error)
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="ag-header-cell-label flex justify-between items-center">
      <span>{props.displayName}</span>
      {props.context.isSuggestionsLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      ) : suggestion ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onParseClick}
                disabled={isLoading}
                className="h-8 w-8 p-0 ml-4"
              >
                <span className="sr-only">Parse column</span>
                <Wand2 className={`h-4 w-4 ${isLoading ? "animate-spin" : ""} stroke-blue-600`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Suggested parse type: {suggestion.parseType}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </div>
  )
}

const EmailsRenderer = (props: any) => {
  const emails = props.value || []
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{emails.length} email(s)</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{emails.join(", ")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const NameRenderer = (props: any) => {
  const { first_name, last_name } = props.value || {}
  return <span>{`${first_name} ${last_name}`}</span>
}

const SocialRenderer = (props: any) => {
  const value = props.value
  if (!value) return <span>-</span>

  let url = value.uuid
  if (value.type === "LINKEDIN") {
    url = `https://www.linkedin.com/in/${value.uuid}`
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 underline"
    >
      {value.uuid}
    </a>
  )
}

const getColumnRenderer = (key: string) => {
  switch (key) {
    case "__emails":
      return EmailsRenderer
    case "__name":
      return NameRenderer
    case "__social":
      return SocialRenderer
    default:
      return undefined
  }
}

// Add this new hook to fetch parsed columns
const useParsedColumns = (uuid: string) => {
  const queryFn = async (): Promise<ParsedColumn[]> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/dataset/${uuid}/parsed-columns`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch parsed columns")
    }
    return response.json()
  }

  return useQuery<ParsedColumn[], Error>({
    queryKey: ["parsedColumns", uuid],
    queryFn,
  })
}

export default function Dataset({ params }: { params: { uuid: string } }) {
  const { uuid } = params
  const { data, isLoading: isDataLoading, error: dataError, refetch } = useDataset(uuid)
  const {
    data: suggestions,
    isLoading: isSuggestionsLoading,
    refetch: refetchSuggestions,
  } = useSuggestions(uuid)
  const { data: parsedColumns, refetch: refetchParsedColumns } = useParsedColumns(uuid)
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([])
  const [rowData, setRowData] = useState<any[]>([])

  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0 && parsedColumns) {
      const parsedColumnNames = parsedColumns.map((col: ParsedColumn) => `__${col.parseType}`)
      // Create a set of all column names (parsed and unparsed)
      const allColumnNames = new Set([
        ...parsedColumnNames,
        ...Object.keys(data[0]).filter((key) => !parsedColumnNames.includes(key)),
      ])

      const columns: ColDef[] = Array.from(allColumnNames).map((key) => {
        const isParsedColumn = key.startsWith("__") && parsedColumnNames.includes(key)
        const displayName = isParsedColumn ? key.replace(/^__/, "") : key
        return {
          field: key,
          headerName: displayName,
          width: calculateColumnWidth(key, data),
          resizable: true,
          headerComponent: CustomHeader,
          headerComponentParams: {
            context: {
              uuid,
              refetchData: refetch,
              refetchParsedColumns, // Add this line
              suggestions: suggestions || {},
              isSuggestionsLoading,
            },
          },
          pinned: isParsedColumn ? "left" : null,
          cellClass: isParsedColumn ? "pinned-column" : "",
          cellRenderer: getColumnRenderer(key),
          valueGetter: (params: any) => {
            return params.data[key] !== undefined ? params.data[key] : null
          },
        }
      })

      // Sort columns to ensure parsed columns appear first
      columns.sort((a, b) => {
        if (a.pinned === "left" && b.pinned !== "left") return -1
        if (a.pinned !== "left" && b.pinned === "left") return 1
        return 0
      })

      setColumnDefs(columns)

      // Add null values for missing parsed columns in each row
      const updatedRowData = data.map((row) => {
        const updatedRow = { ...row }
        parsedColumnNames.forEach((columnName) => {
          if (!(columnName in updatedRow)) {
            updatedRow[columnName] = null
          }
        })
        return updatedRow
      })

      setRowData(updatedRowData)

      // Fetch suggestions after the dataset is loaded
      if (!suggestions) {
        refetchSuggestions()
      }
    }
  }, [
    data,
    suggestions,
    uuid,
    refetch,
    refetchSuggestions,
    isSuggestionsLoading,
    parsedColumns,
    refetchParsedColumns,
  ])

  if (isDataLoading) {
    return <div>Loading dataset...</div>
  }

  if (dataError) {
    return <div className="text-red-500">Error: {(dataError as Error).message}</div>
  }

  return (
    <div>
      <div className="ag-theme-alpine w-full h-[600px]">
        <AgGridReact<any>
          // @ts-expect-error this is a bug in ag-grid-react
          columnDefs={columnDefs}
          rowData={rowData}
          pagination={true}
          paginationPageSize={20}
          domLayout="autoHeight"
          animateRows={false}
          suppressColumnMoveAnimation={true}
          suppressMovableColumns={true}
          suppressCellFocus={true}
          suppressHeaderFocus={true}
          defaultColDef={{
            sortable: true,
            filter: true,
          }}
        />
      </div>
    </div>
  )
}
