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
  fastify.post("/api/dataset/:loadUuid/load/:sourceUuid", loadHandler)
  fastify.get("/api/dataset/:uuid/suggest-parse-columns", suggestColumnsHandler)
  fastify.get("/api/datasets", listDatasetsHandler)
  fastify.get("/api/dataset/:uuid/parsed-columns", getParsedColumnsHandler)
}
