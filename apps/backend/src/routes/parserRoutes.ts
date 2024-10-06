import type { FastifyInstance } from "fastify"
import {
  parseColumnHandler,
  loadHandler,
  getDatasetHandler,
  initializeLoadDatasetHandler,
  suggestColumnsHandler,
  listDatasetsHandler,
  getParsedColumnsHandler,
} from "../controllers/parser"

export async function parserRoutes(fastify: FastifyInstance) {
  fastify.get("/api/dataset/:uuid", getDatasetHandler)
  fastify.post("/api/dataset/:uuid/parse-column", parseColumnHandler)
  fastify.post("/api/dataset/initialize-load", initializeLoadDatasetHandler)
  fastify.get<{
    Params: { loadUuid: string; sourceUuid: string }
  }>("/api/dataset/:loadUuid/load/:sourceUuid", async (request, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    })

    const sendEvent = (data: any) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    try {
      await loadHandler(request, reply, sendEvent)
    } catch (error) {
      console.error("Error in loadHandler:", error)
      sendEvent({ error: "An error occurred while loading the dataset" })
    }

    reply.raw.end()
  })
  fastify.get("/api/dataset/:uuid/suggest-parse-columns", suggestColumnsHandler)
  fastify.get("/api/datasets", listDatasetsHandler)
  fastify.get("/api/dataset/:uuid/parsed-columns", getParsedColumnsHandler)
}
