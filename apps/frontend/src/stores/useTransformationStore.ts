import { create } from 'zustand'

interface TransformationState {
  description: string
  selectedColumn: string
  transformations: Record<string, string>
  uniqueValues: string[]
  setDescription: (description: string) => void
  setSelectedColumn: (columnId: string) => void
  setTransformations: (transformations: Record<string, string>) => void
  setUniqueValues: (values: string[]) => void
  updateTransformation: (original: string, newValue: string) => void
  resetState: () => void
}

export const useTransformationStore = create<TransformationState>((set) => ({
  description: '',
  selectedColumn: '',
  transformations: {},
  uniqueValues: [],
  
  setDescription: (description) => set({ description }),
  setSelectedColumn: (columnId) => set({ selectedColumn: columnId }),
  setTransformations: (transformations) => set({ transformations }),
  setUniqueValues: (values) => set({ uniqueValues: values }),
  updateTransformation: (original, newValue) => 
    set((state) => ({
      transformations: {
        ...state.transformations,
        [original]: newValue,
      }
    })),
  resetState: () => set({
    description: '',
    selectedColumn: '',
    transformations: {},
    uniqueValues: []
  })
})) 