import { Prompt } from "@/components/prompt"
import { Label } from "@/components/label"
import { Textarea } from "@/components/textarea"
import { FixButton } from "./FixButton"
import { Select } from "@/components/select"
import { useCsvData, useCsvMetadata, useGenerateColumnValues } from "@/utils/api"
import { Button } from "@/components/button"
import { ArrowRight, Loader2 } from "lucide-react"
import { useTransformationStore } from "@/stores/useTransformationStore"
import { useEffect } from "react"
import { Table } from "@/components/table"
import { Input } from "@/components/input"
import { toast } from "@/utils/toast"

interface CustomTransformationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    description: string
    columnId: string
    transformations: Record<string, string>
  }) => Promise<void>
  fileId: string
  isApplying: boolean
}

export function CustomTransformationModal({
  open,
  onOpenChange,
  onSubmit,
  fileId,
  isApplying,
}: CustomTransformationModalProps) {
  const { data } = useCsvData(fileId)
  const { data: metadata } = useCsvMetadata(fileId)

  const generateTransformation = useGenerateColumnValues(fileId)

  const {
    description,
    selectedColumn,
    transformations,
    uniqueValues,
    setDescription,
    setSelectedColumn,
    setTransformations,
    setUniqueValues,
    resetState,
  } = useTransformationStore()

  useEffect(() => {
    if (selectedColumn && data?.rows) {
      const values = data.rows.map((row) => row.data[selectedColumn])
      const uniqueValues = Array.from(new Set(values.filter(Boolean)))
      setUniqueValues(uniqueValues)
    } else {
      setUniqueValues([])
    }
  }, [selectedColumn, data?.rows, setUniqueValues])

  const handleGenerate = async () => {
    if (!selectedColumn || !description) return

    try {
      const result = await generateTransformation.mutateAsync(
        {
          columnId: selectedColumn,
          prompt: description,
        },
        {
          onError: () => {
            toast.error("Failed to generate transformations")
          },
        }
      )
      setTransformations(result)
    } catch (e) {
      console.error("Failed to generate transformations:", e)
    }
  }

  const handleSubmit = async () => {
    if (!Object.keys(transformations).length) return

    await onSubmit({
      description,
      columnId: selectedColumn,
      transformations,
    })

    resetState()
  }

  return (
    <Prompt open={open} onOpenChange={onOpenChange}>
      <Prompt.Content className="max-w-5xl max-h-[600px]">
        <Prompt.Header>
          <Prompt.Title>Apply custom fix</Prompt.Title>
          <Prompt.Description>Tell AI what fix you would like to apply</Prompt.Description>
        </Prompt.Header>
        <div className="p-6 flex h-[600px]">
          {/* Left section */}
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label>Column</Label>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <Select.Trigger>
                  <Select.Value placeholder="Select a column" />
                </Select.Trigger>
                <Select.Content>
                  {metadata?.columns?.map((column) => (
                    <Select.Item key={column.id} value={column.id}>
                      {column.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                disabled={!selectedColumn}
                placeholder="Tell AI what to do with this column. Giving examples is helpful."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-[150px] resize-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleGenerate}
                  disabled={!description || generateTransformation.isPending || !selectedColumn}
                  className="ml-auto"
                >
                  {generateTransformation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Divider - replaced Separator with border */}
          <div className="mx-6 my-6 rounded-md w-[2px] bg-ui-bg-subtle" />

          {/* Right section */}
          <div className="space-y-2 flex-1">
            <Label>Preview</Label>
            <TransformationPreviewTable
              isLoading={generateTransformation.isPending}
              transformations={
                selectedColumn
                  ? transformations
                  : {
                      "john smith": "John Smith",
                      "mary jane": "Mary Jane",
                      "robert johnson": "Robert Johnson",
                      "sarah williams": "Sarah Williams",
                      "mike brown": "Mike Brown",
                    }
              }
              originalValues={
                selectedColumn
                  ? uniqueValues
                  : ["john smith", "mary jane", "robert johnson", "sarah williams", "mike brown"]
              }
              onTransformationChange={(original, newValue) => {
                useTransformationStore.getState().updateTransformation(original, newValue)
              }}
              disabled={!selectedColumn}
              overlay={
                !selectedColumn && (
                  <div className="text-center text-muted-foreground">
                    Pick a column to start transforming!
                  </div>
                )
              }
            />
          </div>
        </div>
        <Prompt.Footer>
          <Prompt.Cancel onClick={() => onOpenChange(false)}>Cancel</Prompt.Cancel>
          <FixButton
            onClick={handleSubmit}
            disabled={Object.keys(transformations).length === 0 || isApplying}
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              "Apply Fix"
            )}
          </FixButton>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}

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
