import { Configs } from "../models/configs"
import { closeAudit } from "../functions/audits"
import { Inventory } from "../models/inventory"
import { Products } from "../models/products"
import { JOB } from "../functions/logger"
import { Audit } from "../models/audit"
let isRunning = false
let Logger = new JOB("closing")
const sensitive = true

async function task() {
    try {
        if (!isRunning) {
            isRunning = true
            Logger.log("SE HA INICIADO EL JOB DE CIERRE DE AUDITORIAS SENSIBLES")
            const audit = await Audit.findOne({ sensitive, status: "PENDIENTE" }).sort({ createdAt: -1 })
            if (!!audit) await closeAudit(Audit, audit, Products, Inventory, Logger, sensitive)
            else Logger.log("NO HAY UNA AUDITORIA SENSIBLE ABIERTA")
            Logger.log("SE HA COMPLETADO EL JOB DE AUDICIÓN DE PRODUCTOS NO SENSIBLES")
            Logger.complete()
            isRunning = false
            return
        }
        Logger.warn(" EL JOB DE AUDICIÓN DE CIERRE DE AUDITORIAS SENSIBLES AUN ESTA CORRIENDO, SE HA DENEGADO LA OPERACIÓN ")
    } catch (err) {
        isRunning = false
        Logger.warn("EL JOB DE AUDICIÓN DE CIERRE DE AUDITORIAS SENSIBLES HA FALLADO")
        if (Array.isArray(err)) {
            Logger.error(err[0], err[1], err[2])
            return
        }
        Logger.error("UNKNOW_ERROR", err, "UNKNOW_PARAMS")
    } finally {
        await Logger.save();
    }
}

async function time() {
    let configs = await Configs.findOne({ nameJob: "closing" })
    return configs.cronExpression
}

export default { task, time, name: "closing" }