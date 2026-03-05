import { Configs } from "../models/configs"
import { FDB } from "../config/databases/firebird"
import { JOB } from "../functions/logger"
import path from "path"
import moment from "moment"
const MEDIA_PATH = path.join(__dirname, "..", "..", "..", "..", "resources", "backups")
let isRunning = false
let Firebird = new FDB()
let Logger = new JOB("backups")

async function task() {
    try {
        if (!isRunning) {
            isRunning = true
            Logger.log("SE HA INICIADO EL JOB DE RESPALDOS")
            const backup = await Firebird.backup(path.join(MEDIA_PATH, `${moment(new Date()).format('YYYYMMDD')}.fbk`))
            Logger.log(backup)
            Logger.complete()
            isRunning = false
            return
        }
        Logger.warn(" EL JOB DE RESPALDOS AUN ESTA CORRIENDO, SE HA DENEGADO LA OPERACIÓN ")
    } catch (err) {
        isRunning = false
        if (Array.isArray(err)) {
            Logger.warn("EL JOB DE RESPALDOS HA FALLADO")
            Logger.error(err[0], err[1], err[2])
            return
        }
        Logger.error("UNKNOW_ERROR", err, "UNKNOW_PARAMS")
    } finally {
        await Logger.save();
        await Firebird.detach()
    }
}

async function time() {
    let configs = await Configs.findOne({ nameJob: "backups" })
    return configs.cronExpression
}

export default { task, time, name: "backups" }