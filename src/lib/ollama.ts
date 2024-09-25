import { request } from "undici"

const OLLAMA_API_URL = process.env.LLAMA_API_URL + "/api/generate"

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
