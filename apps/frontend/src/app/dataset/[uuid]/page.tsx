"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { AgGridReact } from "ag-grid-react"
import { ColDef } from "ag-grid-community"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-alpine.css"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const useDataset = (uuid: string) => {
  return useQuery({
    queryKey: ["dataset", uuid],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dataset/${uuid}`)
      if (!response.ok) {
        throw new Error("Failed to fetch dataset")
      }
      return response.json()
    },
  })
}

const calculateColumnWidth = (key: string, data: any[]): number => {
  const maxContentLength = Math.max(key.length, ...data.map((row) => String(row[key]).length))
  // Assuming an average character width of 8 pixels
  return Math.min(Math.max(maxContentLength * 8, 100), 300)
}

const CustomHeader = (props: any) => {
  const onOptionClick = (option: string) => {
    if (option === "hide") {
      props.column.setVisible(false)
    }
    // Add more options here as needed
  }

  return (
    <div className="ag-header-cell-label flex justify-between items-center">
      <span>{props.displayName}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onOptionClick("hide")}>
            Hide Column
          </DropdownMenuItem>
          {/* Add more menu items here */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function Dataset({ params }: { params: { uuid: string } }) {
  const { uuid } = params
  const { data, isLoading, error } = useDataset(uuid)
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([])
  const [rowData, setRowData] = useState<any[]>([])

  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      const columns = Object.keys(data[0]).map((key) => ({
        field: key,
        headerName: key,
        width: calculateColumnWidth(key, data),
        resizable: true,
        headerComponent: CustomHeader,
      }))
      setColumnDefs(columns)
      setRowData(data)
    }
  }, [data])

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
    }),
    []
  )

  if (isLoading) {
    return <div className="p-4">Loading dataset...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {(error as Error).message}</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dataset: {uuid}</h1>
      <div className="ag-theme-alpine w-full h-[600px]">
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          pagination={true}
          paginationPageSize={20}
          domLayout="autoHeight"
          animateRows={false}
          suppressColumnMoveAnimation={true}
          suppressMovableColumns={true}
          defaultColDef={defaultColDef}
        />
      </div>
    </div>
  )
}
