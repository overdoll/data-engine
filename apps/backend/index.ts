require("dotenv").config()

import Fastify from "fastify"
import multipart from "@fastify/multipart"
import cors from "@fastify/cors"

import { connectRedis, disconnectRedis } from "./src/lib/redis"
import { parserRoutes } from "./src/routes/parserRoutes"

const fastify = Fastify({
  logger: true,
})

fastify.register(multipart, { attachFieldsToBody: true })
fastify.register(parserRoutes)
fastify.register(cors, {
  origin: ["http://localhost:3000"],
  credentials: true,
})

fastify.get("/", async (request, reply) => {
  return { hello: "world" }
})

const start = async () => {
  try {
    await connectRedis()
    await fastify.listen({ port: 4000 })
  } catch (err) {
    fastify.log.error(err)
    await disconnectRedis()
    process.exit(1)
  }
}

process.on("SIGINT", async () => {
  await fastify.close()
  await disconnectRedis()
  process.exit(0)
})

start()
