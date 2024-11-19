import { Input } from "@/components/input"
import { Loader2, ArrowRight } from "lucide-react"
import { Table } from "@/components/table"

interface TransformationPreviewTableProps {
  isLoading: boolean
  transformations: Record<string, string>
  originalValues: string[]
  onTransformationChange: (original: string, newValue: string) => void
  disabled?: boolean
  overlay?: React.ReactNode
}

export function TransformationPreviewTable({
  isLoading,
  transformations,
  originalValues,
  onTransformationChange,
  overlay,
  disabled,
}: TransformationPreviewTableProps) {
  return (
    <div className="relative rounded-md border overflow-auto max-h-[350px]">
      <Table>
        <Table.Header className="border-t-0 border-b">
          <Table.Row className="sticky top-0 z-10">
            <Table.HeaderCell className="w-[calc(50%-16px)]">Old</Table.HeaderCell>
            <Table.HeaderCell className="w-8 p-0 text-center" />
            <Table.HeaderCell className="w-[calc(50%-16px)]">New</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body className="border-b-0">
          {originalValues.map((original, i) => (
            <Table.Row key={i} className="last:border-b-0">
              <Table.Cell className="truncate max-w-[200px] w-[200px]">{original}</Table.Cell>
              <Table.Cell className="p-0 text-center">
                <ArrowRight className="h-4 w-4 mx-auto text-muted-foreground" />
              </Table.Cell>
              <Table.Cell>
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <Input
                    disabled={disabled}
                    value={transformations[original] ?? original}
                    onChange={(e) => onTransformationChange(original, e.target.value)}
                    className="h-8"
                  />
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      {overlay && (
        <div className="absolute inset-0 bg-gray-100/50 z-20 flex items-center justify-center disabled:opacity-50">
          {overlay}
        </div>
      )}
    </div>
  )
}
