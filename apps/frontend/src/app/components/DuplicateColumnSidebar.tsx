"use client"

import { CsvColumn, useCsvMetadata } from "@/utils/api"
import { Tooltip, TooltipProvider } from "@/components/tooltip/tooltip"
import { useDuplicatesStore } from "@/stores/duplicates"
import { Checkbox } from "@/components/checkbox"
import { Label } from "@/components/label"
import { Alert } from "@/components/alert"
import React from "react"
import { SidebarHeader } from "./Sidebar"
import Spinner from "@/icons/spinner"
import ArrowRightMini from "@/icons/arrow-right-mini"

export function DuplicateColumnSidebar({ fileId }: { fileId: string }) {
  const { data: metadata } = useCsvMetadata(fileId)
  const { selectedColumns, toggleColumn, isDeduplicating, stats, error } = useDuplicatesStore()

  if (!metadata) return null

  // Sort columns: classified first, then unclassified
  const sortedColumns = [...metadata.columns].sort((a, b) => {
    if (!!a.classification === !!b.classification) return 0
    return a.classification ? -1 : 1
  })

  const classifiedColumns = sortedColumns.filter((column) => !!column.classification)
  const hasClassifiedColumns = classifiedColumns.length > 0
  const allClassifiedSelected = classifiedColumns.every((column) =>
    selectedColumns.includes(column.id)
  )

  const handleSelectAll = () => {
    if (!hasClassifiedColumns) return

    classifiedColumns.forEach((column) => {
      if (allClassifiedSelected) {
        if (selectedColumns.includes(column.id)) {
          toggleColumn(column.id)
        }
      } else {
        if (!selectedColumns.includes(column.id)) {
          toggleColumn(column.id)
        }
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader>
        <div className="flex gap-2 my-auto w-full">
          <div className="flex items-center gap-2 my-auto">
            <Checkbox
              disabled={!hasClassifiedColumns}
              checked={allClassifiedSelected && hasClassifiedColumns}
              onCheckedChange={handleSelectAll}
            />
            <Label className="text-md font-semibold">
              Available columns ({classifiedColumns.length || 0})
            </Label>
          </div>
          {isDeduplicating && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-md ml-auto">
              <Label className="text-xsmall text-gray-400">Deduplicating</Label>
              <Spinner className="h-4 w-4 animate-spin" />
            </div>
          )}
          {hasClassifiedColumns && !error && stats && !isDeduplicating && (
            <div className="flex gap-2 items-center text-sm border rounded-md px-2 py-1 ml-auto">
              <span className="font-semibold">{stats.totalRows}</span>
              <ArrowRightMini className="h-4 w-4 text-gray-400" />
              <span className="font-semibold text-green-500">{stats.duplicateRows}</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      {hasClassifiedColumns && error && !isDeduplicating && (
        <Alert variant="error" className="mx-4 my-2 items-center">
          Select more columns to start deduplication
        </Alert>
      )}
      <div className="relative flex-1 overflow-hidden">
        <div className="overflow-y-auto h-full px-4 py-2">
          {sortedColumns.map((column) => {
            const isClassified = !!column.classification

            const row = (
              <ColumnRow
                column={column}
                isSelected={selectedColumns.includes(column.id)}
                onToggle={toggleColumn}
                disabled={!isClassified || isDeduplicating}
              />
            )

            if (column.classification) {
              return <React.Fragment key={column.id}>{row}</React.Fragment>
            }

            return (
              <TooltipProvider key={column.id}>
                <Tooltip
                  content="This column needs to be fixed before it can be used for deduplication"
                  side="right"
                >
                  {row}
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>

        {!hasClassifiedColumns && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/60 p-4">
            <Alert variant="warning" className="max-w-[95%]">
              You need to fix columns before you can use them for deduplication.
            </Alert>
          </div>
        )}
      </div>
    </div>
  )
}

interface ColumnRowProps {
  column: CsvColumn
  isSelected: boolean
  onToggle: (columnId: string) => void
  disabled: boolean
}

function ColumnRow({ column, isSelected, onToggle, disabled }: ColumnRowProps) {
  return (
    <div
      className={`flex items-center gap-2 py-1 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } border-b`}
    >
      <Checkbox
        id={column.id}
        checked={isSelected}
        onCheckedChange={() => {
          if (!disabled) {
            onToggle(column.id)
          }
        }}
        disabled={disabled}
      />
      <Label htmlFor={column.id} className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>
        {column.label}
      </Label>
    </div>
  )
}
