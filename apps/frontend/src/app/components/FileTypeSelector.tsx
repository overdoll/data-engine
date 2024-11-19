interface FileTypeSelectorProps {
  selectedType: string | null
  onTypeSelect: (type: string) => void
}

export function FileTypeSelector({ selectedType, onTypeSelect }: FileTypeSelectorProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">What type of data is this?</h3>

        <div className="grid grid-cols-2 gap-4">
          <div
            className={`p-6 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
              selectedType === "contacts" ? "border-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => onTypeSelect("contacts")}
          >
            <h4 className="font-medium mb-2">Contacts</h4>
            <p className="text-sm text-gray-600">Deduplicate contact records</p>
          </div>

          <div
            className={`p-6 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
              selectedType === "companies" ? "border-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => onTypeSelect("companies")}
          >
            <h4 className="font-medium mb-2">Companies</h4>
            <p className="text-sm text-gray-600">Deduplicate company records</p>
          </div>
        </div>
      </div>
    </div>
  )
}
