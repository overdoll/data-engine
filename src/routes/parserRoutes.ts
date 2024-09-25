import type { FastifyInstance } from "fastify"
import {
  parseCSVHandler,
  parseColumnHandler,
  loadHandler,
  getDatasetHandler,
  initializeLoadDatasetHandler,
  suggestColumnsHandler,
} from "../controllers/parser"

export async function parserRoutes(fastify: FastifyInstance) {
  fastify.get("/api/dataset/:uuid", getDatasetHandler)
  fastify.post("/api/parse-csv", parseCSVHandler)
  fastify.post("/api/dataset/:uuid/parse-column", parseColumnHandler)
  fastify.post("/api/dataset/initialize-load", initializeLoadDatasetHandler)
  fastify.post("/api/dataset/:loadUuid/load/:sourceUuid", loadHandler)
  fastify.get("/api/dataset/:uuid/suggest-parse-columns", suggestColumnsHandler)
}
