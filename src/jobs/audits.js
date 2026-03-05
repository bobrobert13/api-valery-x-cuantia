import { Configs } from "../models/configs"
import { initAudit, closeAudit } from "../functions/audits"
import { Inventory } from "../models/inventory"
import { Products } from "../models/products"
import { JOB } from "../functions/logger"
import { Audit } from "../models/audit"
const sensitive = false
let isRunning = false
let Logger = new JOB("audits")

async function task() {
    try {
        if (!isRunning) {
            isRunning = true
            Logger.log("SE HA INICIADO EL JOB DE AUDITORIAS NO SENSIBLES")
            const audit = await Audit.findOne({ sensitive }).sort({ createdAt: -1 })
            !audit || audit.status[0] !== 'PENDIENTE' ? await initAudit(Audit, audit, Products, Inventory, Logger, sensitive) : await closeAudit(Audit, audit, Products, Inventory, Logger, sensitive)
            Logger.log("SE HA COMPLETADO EL JOB DE AUDICIÓN DE PRODUCTOS NO SENSIBLES")
            Logger.complete()
            return
        }
        Logger.warn(" EL JOB DE AUDICIÓN DE PRODUCTOS DE PRODUCTOS NO SENSIBLES AUN ESTA CORRIENDO, SE HA DENEGADO LA OPERACIÓN ")
    } catch (err) {
        Logger.warn("EL JOB DE AUDICIÓN DE PRODUCTOS NO SENSIBLES HA FALLADO")
        if (Array.isArray(err)) {
            Logger.error(err[0], err[1], err[2])
            return
        }
        Logger.error("UNKNOW_ERROR", err, "UNKNOW_PARAMS")
    } finally {
        await Logger.save();
        isRunning = false
    }

}

async function time() {
    let configs = await Configs.findOne({ nameJob: "audits" })
    return configs.cronExpression
}

export default { task, time, name: "audits" }