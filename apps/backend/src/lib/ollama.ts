import { request } from "undici"
import OpenAI from "openai"
import { z } from "zod"
import { zodResponseFormat } from "openai/helpers/zod.mjs"

const OLLAMA_API_URL = process.env.LLAMA_API_URL + "/api/generate"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
}

export async function generateWithOllama(
  prompt: string,
  model: string = "codellama"
): Promise<string> {
  try {
    const { body } = await request(OLLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
      }),
    })

    let fullResponse = ""
    for await (const chunk of body) {
      const chunkStr = new TextDecoder().decode(chunk)
      const lines = chunkStr.split("\n").filter((line) => line.trim() !== "")
      for (const line of lines) {
        try {
          const response = JSON.parse(line) as OllamaResponse
          fullResponse += response.response
        } catch (parseError) {
          console.error("Error parsing JSON chunk:", parseError)
        }
      }
    }

    return fullResponse
  } catch (error) {
    console.error("Error generating with Ollama:", error)
    throw new Error("Failed to generate response with Ollama")
  }
}

export async function generateWithOpenAI(
  prompt: string,
  structure: z.ZodObject<any, any>
): Promise<Record<string, any>> {
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini-2024-07-18", // Using the latest model that supports function calling
      messages: [{ role: "system", content: prompt }],
      response_format: zodResponseFormat(structure, "event"),
    })

    const event = completion.choices[0].message.parsed

    return event as any
  } catch (error) {
    console.error("Error generating with OpenAI:", error)
    throw new Error("Failed to generate response with OpenAI")
  }
}
