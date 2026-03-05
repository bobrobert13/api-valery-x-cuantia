import { Configs } from "../models/configs"
import { JOB } from "../functions/logger"
import { FDB } from "../config/databases/firebird"
import { updateCuantiaCurrencies } from "../functions/actTasas"
import { Data } from "../models/data"
let isRunning = false
let Logger = new JOB("actTasas")
const Firebird = new FDB()

async function task() {
    try {
        if (!isRunning) {
            isRunning = true
            await Firebird.connect()
            Logger.log("SE HA INICIADO EL JOB DE ACTUALIZACIÓN DE TASAS")
            const currencies = await Firebird.query(`
            select moneda.factor_cambio, moneda.nombre from moneda where moneda.codigo = '02'`)
            const localData = await Data.findOne({}).lean()
            const update = await updateCuantiaCurrencies(currencies, localData.token)
            if (update.status) {
                Logger.log("SE HAN ACTUALIZADOS LAS TASAS EN CUANTIA")
            } else {
                throw ["UPDATE_CURRENCY_ERROR", update.status, JSON.stringify(currencies)]
            }
            Logger.log("SE HA COMPLETADO EL JOB DE ACTUALIZACIÓN DE TASAS")
            Logger.complete()
            isRunning = false
            return
        }
        Logger.warn("EL JOB DE APERTURA DE ACTUALIZACIÓN DE TASAS ESTA CORRIENDO, SE HA DENEGADO LA OPERACIÓN")
    } catch (err) {
        Logger.warn("EL JOB DE ACTUALIZACIÓN HA FALLADO")
        if (Array.isArray(err)) {
            Logger.error(err[0], err[1], err[2])
            isRunning = false
            return
        }
        Logger.error("UNKNOW_ERROR", err, "UNKNOW_PARAMS")
        isRunning = false
    } finally {
        await Logger.save();
        await Firebird.detach();
    }
}

async function time() {
    let configs = await Configs.findOne({ nameJob: "actTasas" })
    return configs.cronExpression
}

export default { task, time, name: "actTasas" }