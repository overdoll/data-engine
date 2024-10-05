import type { FastifyRequest, FastifyReply } from "fastify"
import { parse } from "csv-parse"
import { Readable } from "stream"
import { v4 as uuidv4 } from "uuid"
import { redisClient } from "../lib/redis"
import type { ParseType, ParsedColumn, ParsedData, NameData, SocialData } from "../types/parser"
import { generateWithOllama } from "../lib/ollama"

// Update the COLUMNS_CONFIG
const COLUMNS_CONFIG = {
  linkedin_url: "__social",
  first_name: "__name",
  last_name: "__name",
  name: "__name",
  email: "__emails",
} as const

// Create constants for each column mapping
const COL_SOCIAL = COLUMNS_CONFIG.linkedin_url
const COL_NAME = COLUMNS_CONFIG.name
const COL_EMAILS = COLUMNS_CONFIG.email

async function saveData(uuid: string, data: Record<string, any>[]) {
  await redisClient.set(uuid, JSON.stringify(data))
}

async function getData(uuid: string): Promise<Record<string, any>[] | null> {
  const data = await redisClient.get(uuid)
  return data ? JSON.parse(data) : null
}

async function parseCSV(buffer: Buffer): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
    })

    const results: Record<string, any>[] = []

    Readable.from(buffer)
      .pipe(parser)
      .on("data", (row) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err))
  })
}

function parseLinkedInUrl(url: string): SocialData | null {
  try {
    const pathParts = url.split("/") || []
    const uuid = pathParts[pathParts.length - 1]
    return uuid ? { uuid, type: "LINKEDIN" } : null
  } catch (error) {
    return null
  }
}

// Add this function to track parsed columns
function addParsedColumn(uuid: string, columnName: string, parseType: ParseType) {
  return redisClient.sAdd(`${uuid}-parsed-columns`, JSON.stringify({ columnName, parseType }))
}

export async function parseCSVHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await request.file()
  if (!data) {
    return reply.code(400).send({ error: "No file uploaded" })
  }

  try {
    const parsedData = await parseCSV(await data.toBuffer())
    const uuid = uuidv4()
    await saveData(uuid, parsedData)
    reply.send({ uuid })
  } catch (error) {
    reply.code(500).send({ error })
  }
}

export async function getDatasetHandler(
  request: FastifyRequest<{
    Params: { uuid: string }
  }>,
  reply: FastifyReply
) {
  const { uuid } = request.params
  const data = await getData(uuid)
  if (!data) {
    return reply.code(404).send({ error: "Dataset not found" })
  }
  reply.send(data)
}

// Modify parseColumnHandler to track parsed columns
export async function parseColumnHandler(
  request: FastifyRequest<{
    Params: { uuid: string }
    Body: { columnName: string; parseType: ParseType }
  }>,
  reply: FastifyReply
) {
  const { uuid } = request.params
  const { columnName, parseType } = request.body

  const data = await getData(uuid)
  if (!data) {
    return reply.code(404).send({ error: "Data not found" })
  }

  if (!columnName || !parseType) {
    return reply.code(400).send({ error: "Column name and parse type are required" })
  }

  let updatedData: Record<string, any>[]

  switch (parseType) {
    case "linkedin_url":
      updatedData = data.map((row) => {
        if (row[columnName]) {
          const parsedValue = parseLinkedInUrl(row[columnName])
          if (parsedValue) {
            return { ...row, [COL_SOCIAL]: parsedValue }
          }
        }
        return row
      })
      break

    case "first_name":
    case "last_name":
    case "name":
      updatedData = data.map((row) => {
        if (row[columnName]) {
          let parsedValue: NameData
          switch (parseType) {
            case "first_name":
              parsedValue = parseFirstName(row[columnName])
              break
            case "last_name":
              parsedValue = parseLastName(row[columnName])
              break
            case "name":
              parsedValue = parseName(row[columnName])
              break
          }
          return {
            ...row,
            [COL_NAME]: {
              ...row[COL_NAME],
              ...parsedValue,
            },
          }
        }
        return row
      })
      break

    case "email":
      updatedData = data.map((row) => {
        if (row[columnName]) {
          const parsedEmail = parseEmail(row[columnName])
          return {
            ...row,
            [COL_EMAILS]: row[COL_EMAILS] ? [...row[COL_EMAILS], parsedEmail] : [parsedEmail],
          }
        }
        return row
      })
      break

    default:
      return reply.code(400).send({ error: "Unsupported parse type" })
  }

  await addParsedColumn(uuid, columnName, parseType)
  await saveData(uuid, updatedData)
  reply.send({ message: `Column "${columnName}" parsed successfully` })
}

// New function to initialize a load dataset
export async function initializeLoadDatasetHandler(request: FastifyRequest, reply: FastifyReply) {
  const loadUuid = uuidv4()
  await saveData(loadUuid, []) // Initialize with an empty array

  reply.send({
    message: "Load dataset initialized successfully",
    loadUuid,
  })
}

// Updated loadHandler function
export async function loadHandler(
  request: FastifyRequest<{
    Params: { loadUuid: string; sourceUuid: string }
  }>,
  reply: FastifyReply
) {
  const { loadUuid, sourceUuid } = request.params

  const sourceData = await getData(sourceUuid)
  if (!sourceData) {
    return reply.code(404).send({ error: "Source dataset not found" })
  }

  let existingLoadedData = (await getData(loadUuid)) || []
  let createdCount = 0
  let updatedCount = 0

  const pipeline = redisClient.multi()

  for (const row of sourceData) {
    // Filter only parsed columns (starting with "__")
    const parsedRow: ParsedData = Object.entries(row).reduce((acc, [key, value]) => {
      if (key.startsWith("__")) {
        acc[key] = value
      }
      return acc
    }, {} as ParsedData)

    if (Object.keys(parsedRow).length === 0) {
      continue // Skip rows with no parsed data
    }

    let matchedUuid: string | null = null

    // Check for match based on LinkedIn
    if (parsedRow.__social && parsedRow.__social.uuid) {
      const socialMatches = await redisClient.sMembers(
        `index:${loadUuid}:social:${parsedRow.__social.uuid}`
      )
      if (socialMatches.length > 0) {
        matchedUuid = socialMatches[0]
      }
    }

    // If no match found, check for match based on email
    if (!matchedUuid && parsedRow.__emails && parsedRow.__emails.length > 0) {
      for (const email of parsedRow.__emails) {
        const emailMatches = await redisClient.sMembers(`index:${loadUuid}:email:${email}`)
        if (emailMatches.length > 0) {
          matchedUuid = emailMatches[0]
          break
        }
      }
    }

    // If still no match found, check for match based on name
    if (
      !matchedUuid &&
      parsedRow.__name &&
      parsedRow.__name.first_name &&
      parsedRow.__name.last_name
    ) {
      const fullName = `${parsedRow.__name.first_name} ${parsedRow.__name.last_name}`.toLowerCase()
      const nameMatches = await redisClient.sMembers(`index:${loadUuid}:name:${fullName}`)
      if (nameMatches.length > 0) {
        matchedUuid = nameMatches[0]
      }
    }

    let updatedRow: ParsedData

    if (matchedUuid) {
      // Merge data with existing record
      const existingRow = existingLoadedData.find((r) => r.uuid === matchedUuid)
      if (existingRow) {
        updatedRow = mergeRows(existingRow, parsedRow)
        updatedRow.uuid = matchedUuid
        // Remove old indexes
        // Update the existing row in the array
        Object.assign(existingRow, updatedRow)
        updatedCount++
      } else {
        // This shouldn't happen, but just in case
        console.warn(`Matched UUID ${matchedUuid} not found in existingLoadedData`)
        updatedRow = { ...parsedRow, uuid: uuidv4() }
        existingLoadedData.push(updatedRow)
        createdCount++
      }
    } else {
      // Create new record
      updatedRow = { ...parsedRow, uuid: uuidv4() }
      existingLoadedData.push(updatedRow)
      createdCount++
    }

    // Add new indexes for the updated row
    await addIndexes(pipeline, loadUuid, updatedRow)
    // Execute all index operations
    await pipeline.exec()
  }

  // Save updated data
  await saveData(loadUuid, existingLoadedData)

  reply.send({
    message: "Data loaded successfully",
    sourceUuid,
    loadUuid,
    summary: {
      totalProcessed: sourceData.length,
      created: createdCount,
      updated: updatedCount,
      totalLoaded: existingLoadedData.length,
    },
  })
}

// Helper function to merge rows
function mergeRows(existingRow: ParsedData, newRow: ParsedData): ParsedData {
  const mergedRow: ParsedData = { ...existingRow }

  if (newRow.__name) {
    mergedRow.__name = {
      ...existingRow.__name,
      ...newRow.__name,
    }
  }

  if (newRow.__social) {
    mergedRow.__social = newRow.__social
  }

  if (newRow.__emails) {
    mergedRow.__emails = Array.from(new Set([...(existingRow.__emails || []), ...newRow.__emails]))
  }

  return mergedRow
}

// Updated addIndexes function
async function addIndexes(pipeline: any, loadUuid: string, row: ParsedData) {
  if (row.__name && row.__name.first_name && row.__name.last_name) {
    const fullName = `${row.__name.first_name} ${row.__name.last_name}`.toLowerCase()
    pipeline.sAdd(`index:${loadUuid}:name:${fullName}`, row.uuid)
  }
  if (row.__social && row.__social.uuid) {
    pipeline.sAdd(`index:${loadUuid}:social:${row.__social.uuid}`, row.uuid)
  }
  if (row.__emails) {
    for (const email of row.__emails) {
      pipeline.sAdd(`index:${loadUuid}:email:${email}`, row.uuid)
    }
  }
}

// Updated removeIndexes function
async function removeIndexes(pipeline: any, loadUuid: string, row: ParsedData) {
  if (row.__name?.first_name && row.__name?.last_name) {
    const oldFullName = `${row.__name.first_name} ${row.__name.last_name}`.toLowerCase()
    pipeline.sRem(`index:${loadUuid}:name:${oldFullName}`, row.uuid)
  }
  if (row.__social?.uuid) {
    pipeline.sRem(`index:${loadUuid}:social:${row.__social.uuid}`, row.uuid)
  }
  if (row.__emails) {
    for (const email of row.__emails) {
      pipeline.sRem(`index:${loadUuid}:email:${email}`, row.uuid)
    }
  }
}

// Update these parsing functions
function parseFirstName(name: string): NameData {
  return { first_name: name.trim().toLowerCase() }
}

function parseLastName(name: string): NameData {
  return { last_name: name.trim().toLowerCase() }
}

function parseName(name: string): NameData {
  const nameParts = name.trim().toLowerCase().split(/\s+/)
  return {
    first_name: nameParts[0] || "",
    last_name: nameParts[nameParts.length - 1] || "",
  }
}

// Add this new function to parse emails
function parseEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function suggestColumnsHandler(
  request: FastifyRequest<{
    Params: { uuid: string }
  }>,
  reply: FastifyReply
) {
  const { uuid } = request.params

  const data = await getData(uuid)
  if (!data) {
    return reply.code(404).send({ error: "Dataset not found" })
  }

  const sampleData: Record<string, string[]> = {}

  // Process the data to create the sampleData dictionary
  for (const row of data) {
    for (const [columnName, value] of Object.entries(row)) {
      if (!sampleData[columnName]) {
        sampleData[columnName] = []
      }
      if (
        value &&
        typeof value === "string" &&
        value.trim() !== "" &&
        sampleData[columnName].length < 5
      ) {
        sampleData[columnName].push(value.trim())
      }
    }
  }

  const endpoint = `curl -X POST http://localhost:3000/parse/${uuid} -H "Content-Type: application/json" -d '{"columnName": "COLUMN_NAME", "parseType": "PARSE_TYPE"}'`

  const prompt = `
  You are a helper that is going to help me run data parsing against a dataset. Here is the dataset:
  ${JSON.stringify(sampleData)}
  This dataset is an object, where the key is the column name, and the value is a sample of the data.

  I want to parse the data into a standardized format. I already have an endpoint to do this:
  ${endpoint}

  This endpoint accepts the name of the column as columnName (the key in the sampleData object), and the type of parsing as parseType.
  The following parseTypes are available:
  name - The full name of a person. Only works if the column has a full name of a human, and the name is, in your opinion, real. A full name includes a first name, an optional middle name, and a last name. You should only choose one column for this parseType.
  first_name - The first name of the person. You should only choose one column for this parseType. If there is already a full name, do not use this.
  last_name - The last name of the person. You should only choose one column for this parseType. If there is already a full name, do not use this.
  linkedin_url - The URL of a person's LinkedIn profile. Only works if the column has a URL to a LinkedIn profile, and the URL is, in your opinion, real. You should only choose one column for this parseType.
  email - The email of a person. Only works if the column has a valid email, and the email is, in your opinion, real. There can be multiple columns for this parseType.

  Based on the parseTypes that are available and the rules for parsing them, look at all the data and the column names.
  Give me a list of endpoints for this dataset, using CURL, that I will run on the dataset.
  - Make sure to include the column name and the parse type.
  - Do not include anything in your response BUT the list of CURL commands.
  `

  try {
    const suggestions = await generateWithOllama(prompt)
    reply.send(suggestions)
  } catch (error) {
    console.error("Error generating suggestions:", error)
    reply.code(500).send({ error: "Failed to generate suggestions" })
  }
}
