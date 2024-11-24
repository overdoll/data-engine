"use client"

import { useCsvMetadata } from "@/utils/api"
import { Tooltip, TooltipProvider } from "@/components/tooltip/tooltip"
import { useDuplicatesStore } from "@/stores/duplicates"
import { Checkbox } from "@/components/checkbox"
import { Label } from "@/components/label"
import { Alert } from "@/components/alert"
import React from "react"
import { DuplicatesToggle } from "./DuplicatesToggle"

interface DuplicateColumnSelectorProps {
  fileId: string
}

export function DuplicateColumnSelector({ fileId }: DuplicateColumnSelectorProps) {
  const { data: metadata } = useCsvMetadata(fileId)
  const { selectedColumns, toggleColumn } = useDuplicatesStore()

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
    <div className="flex flex-col gap-2 p-4 h-full">
      <div className="flex flex-col gap-3 border-b">
        <div className="flex justify-between items-center mb-2 sticky top-0 z-10 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                disabled={!hasClassifiedColumns}
                checked={allClassifiedSelected && hasClassifiedColumns}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-md font-semibold">
                Available columns ({classifiedColumns.length || 0})
              </Label>
            </div>
          </div>
          <DuplicatesToggle />
        </div>

        {!hasClassifiedColumns && (
          <Alert variant="warning" className="mb-2">
            You need to fix columns before you can use them for deduplication.
          </Alert>
        )}

        <div className="overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
          {sortedColumns.map((column) => {
            const isClassified = !!column.classification

            const row = (
              <ColumnRow
                column={column}
                isSelected={selectedColumns.includes(column.id)}
                onToggle={toggleColumn}
                disabled={!isClassified}
              />
            )

            if (column.classification) {
              return <React.Fragment key={column.id}>{row}</React.Fragment>
            }

            return (
              <TooltipProvider key={column.id}>
                <Tooltip content="This column needs to be fixed before it can be used for deduplication">
                  {row}
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface ColumnRowProps {
  column: {
    id: string
    label: string
    classification?: string
  }
  isSelected: boolean
  onToggle: (id: string) => void
  disabled: boolean
}

function ColumnRow({ column, isSelected, onToggle, disabled }: ColumnRowProps) {
  return (
    <div className={`flex items-center gap-2 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
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
      <Label htmlFor={column.id} className="cursor-pointer">
        {column.label}
      </Label>
    </div>
  )
}
