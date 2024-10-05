export type ParseType = "linkedin_url" | "first_name" | "last_name" | "name" | "email"

export interface ParsedColumn {
  columnName: string
  parseType: ParseType
}

export interface NameData {
  first_name?: string
  last_name?: string
}

export interface SocialData {
  uuid: string
  type: string
}

export interface ParsedData {
  uuid?: string
  __name?: NameData
  __social?: SocialData
  __emails?: string[]
  [key: string]: any
}

// ... rest of the file remains the same
