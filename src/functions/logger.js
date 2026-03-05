import { Logs } from "../models/logs"
import { Jobs } from "../models/jobs"
import { System } from "../models/system"
import { Request } from "../models/request"
import colors from 'colors'
import moment from 'moment'
import path from "path"
import fs from "fs"
const MEDIA_PATH = path.join(__dirname, "..", "..", "..", "..", "resources", "logs")
const jobPath = path.join(MEDIA_PATH, "logs.txt")
const logger = fs.createWriteStream(jobPath, { flags: 'a' })
class LOG {
    constructor(moduleName) {
        this.lines = []
        this.moduleName = moduleName
        this.status = false
    }
    log(message) {
        const date = new Date()
        const formated = moment(date).format('YYYY-MM-DD h:mm:ss a')
        console.log(
            colors.green(`(LOG)`) +
            colors.blue(` --- ${colors.white(this.moduleName)} --- `) +
            colors.yellow(`(${formated})`) +
            ` ${message}`
        )
        this.lines.push({ type: "LOG", message, date })
    }

    warn(message) {
        const date = new Date()
        const formated = moment(date).format('YYYY-MM-DD h:mm:ss a')
        console.log(
            colors.yellow(`(WARNING)`) +
            colors.blue(` --- ${colors.white(this.moduleName)} --- `) +
            colors.yellow(`(${formated})`) +
            ` ${message}`
        )
        this.lines.push({ type: "WARNING", message, date })

    }

    error(message, error, params) {
        const date = new Date()
        const formated = moment(date).format('YYYY-MM-DD h:mm:ss a')
        console.log(
            colors.red(`(ERROR)`) +
            colors.blue(` --- ${colors.white(this.moduleName)} --- `) +
            colors.yellow(`(${formated})`) + colors.red(" NAME: ") +
            message +
            colors.red(" ERROR: ") +
            error +
            colors.red(" PARAMS: ") +
            params
        )
        this.lines.push({ type: "ERROR", message, date, error, params })
    }

    complete() {
        this.status = true
    }

    async save() {
        let logs = {
            type: "JOB",
            module: this.moduleName,
            lines: this.lines,
            status: this.status
        }
        await Logs.create(logs)
        this.lines = []
        this.status = false
    }
}
class JOB {
    constructor(moduleName) {
        this.lines = []
        this.moduleName = moduleName
        this.status = false
    }
    log(message) {
        const date = new Date()
        const formated = moment(date).format('YYYY-MM-DD h:mm:ss a')
        console.log(
            colors.green(`(LOG)`) +
            colors.blue(` --- ${colors.white(this.moduleName)} --- `) +
            colors.yellow(`(${formated})`) +
            ` ${message}`
        )
        logger.write(`(LOG) --- ${this.moduleName} --- (${formated}) ${message}` + '\n')
        this.lines.push({ type: "LOG", message, date })
    }

    warn(message) {
        const date = new Date()
        const formated = moment(date).format('YYYY-MM-DD h:mm:ss a')
        console.log(
            colors.yellow(`(WARNING)`) +
            colors.blue(` --- ${colors.white(this.moduleName)} --- `) +
            colors.yellow(`(${formated})`) +
            ` ${message}`
        )
        logger.write(`(WARNING) --- ${this.moduleName} --- (${formated}) ${message}` + '\n')
        this.lines.push({ type: "WARNING", message, date })

    }

    error(message, error, params) {
        const date = new Date()
        const formated = moment(date).format('YYYY-MM-DD h:mm:ss a')
        console.log(
            colors.red(`(ERROR)`) +
            colors.blue(` --- ${colors.white(this.moduleName)} --- `) +
            colors.yellow(`(${formated})`) + colors.red(" NAME: ") +
            message +
            colors.red(" ERROR: ") +
            error +
            colors.red(" PARAMS: ") +
            params
        )
        logger.write(`(ERROR) --- ${this.moduleName} --- (${formated}) NAME: ${message} ERROR: ${error} PARAMS: ${params}` + '\n')
        this.lines.push({ type: "ERROR", message, date, error, params })
    }

    complete() {
        this.status = true
    }

    async save() {
        let logs = {
            type: "JOB",
            module: this.moduleName,
            lines: this.lines,
            status: this.status
        }
        await Jobs.create(logs)
        this.lines = []
        this.status = false
    }
}
class SYSTEM {
    constructor(moduleName) {
        this.lines = []
        this.moduleName = moduleName
        this.status = false
    }
    log(message) {
        const date = new Date()
        const formated = moment(date).format('YYYY-MM-DD h:mm:ss a')
        console.log(
            colors.green(`(LOG)`) +
            colors.blue(` --- ${colors.white(this.moduleName)} --- `) +
            colors.yellow(`(${formated})`) +
            ` ${message}`
        )
        logger.write(`(LOG) --- ${this.moduleName} --- (${formated}) ${message}` + '\n')
        this.lines.push({ type: "LOG", message, date })
    }

    warn(message) {
        const date = new Date()
        const formated = moment(date).format('YYYY-MM-DD h:mm:ss a')
        console.log(
            colors.yellow(`(WARNING)`) +
            colors.blue(` --- ${colors.white(this.moduleName)} --- `) +
            colors.yellow(`(${formated})`) +
            ` ${message}`
        )
        logger.write(`(WARNING) --- ${this.moduleName} --- (${formated}) ${message}` + '\n')
        this.lines.push({ type: "WARNING", message, date })

    }

    error(message, error, params) {
        const date = new Date()
        const formated = moment(date).format('YYYY-MM-DD h:mm:ss a')
        console.log(
            colors.red(`(ERROR)`) +
            colors.blue(` --- ${colors.white(this.moduleName)} --- `) +
            colors.yellow(`(${formated})`) + colors.red(" NAME: ") +
            message +
            colors.red(" ERROR: ") +
            error +
            colors.red(" PARAMS: ") +
            params
        )
        logger.write(`(ERROR) --- ${this.moduleName} --- (${formated}) NAME: ${message} ERROR: ${error} PARAMS: ${params}` + '\n')
        this.lines.push({ type: "ERROR", message, date, error, params })
    }

    complete() {
        this.status = true
    }

    async save() {
        let logs = {
            type: "SYSTEM",
            module: this.moduleName,
            lines: this.lines,
            status: this.status
        }
        await System.create(logs)
        this.lines = []
        this.status = false
    }
}
class REQUEST {
    constructor(moduleName, endPoint, address) {
        this.lines = []
        this.moduleName = moduleName
        this.address = address
        this.endPoint = endPoint
        this.status = false
    }
    log(message) {
        const date = new Date()
        const formated = moment(date).format('YYYY-MM-DD h:mm:ss a')
        console.log(
            colors.green(`(LOG)`) +
            colors.blue(` --- ${colors.white(this.moduleName)} --- `) +
            colors.yellow(`(${formated})`) +
            ` ${message}`
        )
        logger.write(`(LOG) --- ${this.moduleName} --- (${formated}) ${message}` + '\n')
        this.lines.push({ type: "LOG", message, date })
    }

    warn(message) {
        const date = new Date()
        const formated = moment(date).format('YYYY-MM-DD h:mm:ss a')
        console.log(
            colors.yellow(`(WARNING)`) +
            colors.blue(` --- ${colors.white(this.moduleName)} --- `) +
            colors.yellow(`(${formated})`) +
            ` ${message}`
        )
        logger.write(`(WARNING) --- ${this.moduleName} --- (${formated}) ${message}` + '\n')
        this.lines.push({ type: "WARNING", message, date })

    }

    error(message, error, params) {
        const date = new Date()
        const formated = moment(date).format('YYYY-MM-DD h:mm:ss a')
        console.log(
            colors.red(`(ERROR)`) +
            colors.blue(` --- ${colors.white(this.moduleName)} --- `) +
            colors.yellow(`(${formated})`) + colors.red(" NAME: ") +
            message +
            colors.red(" ERROR: ") +
            error +
            colors.red(" PARAMS: ") +
            params
        )
        logger.write(`(ERROR) --- ${this.moduleName} --- (${formated}) NAME: ${message} ERROR: ${error} PARAMS: ${params}` + '\n')
        this.lines.push({ type: "ERROR", message, date, error, params })
    }

    complete() {
        this.status = true
    }

    async save() {
        let logs = {
            type: "REQUEST",
            module: this.moduleName,
            lines: this.lines,
            address: this.address,
            endPoint: this.endPoint,
            status: this.status
        }
        await Request.create(logs)
        this.lines = []
        this.status = false
    }
}

export { LOG, JOB, SYSTEM, REQUEST }