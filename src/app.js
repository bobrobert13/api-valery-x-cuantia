import express from "express"
import { initJobs } from "./jobs"
import { connectionsInit } from "./functions/connection"
import cors from "cors"
import { SYSTEM } from './functions/logger'
import path from "path"
import { Server } from "socket.io"
import { createServer } from "http"
import fs from "fs"
const Logger = new SYSTEM("SYSTEM")
const resources = path.join(__dirname, "..", "..", "..", "resources")
const port = process.env.PORT || 4500
const socketPort = process.env.SOCKET_PORT || 8095
const app = express()
const serverSocket = createServer(app);

app.use(cors())
app.use(express.json())
app.use(express.static(resources))

export const io = new Server(serverSocket, {
    cors: {
        origin: "*",
        credentials: false,
        allowedHeaders: true,
        methods: ['POST', 'GET']
    }
})

export const socket = io.on("connection", (socket) => {
    socket.emit("connected", { status: true })
    return socket
})

app.listen(port, () => {
    Logger.log(`SERVE ON PORT: ${port}`)
})

serverSocket.listen(socketPort, () => {
    Logger.log(`WEB SOCKET ON PORT: ${socketPort}`)
})

async function start() {
    try {
        app.use("/", require("./routes"))
        await connectionsInit(Logger)
        Logger.log("LAS BASES DE DATOS SE INICIARON CORRECTAMENTE")
        initJobs()
        Logger.log("LOS JOBS INICIARON CORRECTAMENTE")
        Logger.complete()
    }
    catch (err) {
        Logger.warn("LA INICIALIZACIÓN DE LA APLICACIÓN HA FALLADO")
        if (Array.isArray(err)) {
            Logger.error(err[0], err[1], err[2])
            return
        }
        Logger.error("UNKNOW_ERROR", err, "UNKNOW_PARAMS")
    } finally {
        await Logger.save()
    }
}

start()

process.on('uncaughtException', async (err) => {
    Logger.error("SYSTEM_UNCAUGHT_ERROR", err, "UNKNOW_PARAMS")
    await Logger.save()
})

process.on('unhandledRejection', async (reason, promise) => {
    Logger.error("SYSTEM_UNHANDLED_ERROR", reason.stack, "UNKNOW_PARAMS")
    await Logger.save()
})