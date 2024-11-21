import { DatasetType } from "@/utils/api"

interface FileTypeSelectorProps {
  selectedType: DatasetType
  onTypeSelect: (type: DatasetType) => void
}

export function FileTypeSelector({ selectedType, onTypeSelect }: FileTypeSelectorProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`p-6 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
              selectedType === "PERSON" ? "border-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => onTypeSelect("PERSON")}
          >
            <h4 className="font-medium mb-2">Contacts</h4>
            <p className="text-sm text-gray-600">Deduplicate contact records</p>
          </div>

          <div
            className={`p-6 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
              selectedType === "COMPANY" ? "border-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => onTypeSelect("COMPANY")}
          >
            <h4 className="font-medium mb-2">Companies</h4>
            <p className="text-sm text-gray-600">Deduplicate company records</p>
          </div>
        </div>
      </div>
    </div>
  )
}
