import { useCsvData } from "@/utils/api"
import { Table } from "@/components/table/table"

interface CsvViewerProps {
  fileId: string
}

export function CsvViewer({ fileId }: CsvViewerProps) {
  const { data, isLoading, error } = useCsvData(fileId)

  console.log(data)

  if (isLoading) {
    return <div className="flex-1 p-4">Loading...</div>
  }

  if (error) {
    return <div className="flex-1 p-4 text-red-500">Error loading CSV data</div>
  }

  if (!data) return null

  return (
    <div className="flex-1 overflow-auto">
      <Table>
        <Table.Header>
          <Table.Row>
            {data.headers.map((header: string, i: number) => (
              <Table.HeaderCell key={i}>{header}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.rows.map((row: string[], i: number) => (
            <Table.Row key={i}>
              {row.map((cell: string, j: number) => (
                <Table.Cell key={j}>{cell}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}
