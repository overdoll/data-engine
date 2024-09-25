import Fastify from "fastify"
import multipart from "@fastify/multipart"
import { parserRoutes } from "./src/routes/parserRoutes"
import { connectRedis, disconnectRedis } from "./src/lib/redis"

const fastify = Fastify({
  logger: true,
})

fastify.register(multipart)
fastify.register(parserRoutes)

fastify.get("/", async (request, reply) => {
  return { hello: "world" }
})

const start = async () => {
  try {
    await connectRedis()
    await fastify.listen({ port: 3000 })
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
