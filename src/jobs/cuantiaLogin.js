import { authCuantia } from "../functions/cuantiaLogin"
import { Configs } from "../models/configs"
import { Data } from "../models/data"
import { JOB } from "../functions/logger"
let isRunning = false

async function task() {
    let Logger = new JOB("cuantiaLogin")
    try {
        if (!isRunning) {
            isRunning = true
            Logger.log("SE HA INICIADO EL JOB DE AUTENTICACIÓN CON CUANTIA")
            const token = await authCuantia()
            const data = await Data.find()
            const dataUpdate = await Data.updateOne({ _id: data[0]._id }, {
                $set: {
                    token: token
                }
            })
            if (dataUpdate.modifiedCount) {
                Logger.log("SE HA AUTENTICADO CON CUANTIA Y ACTUALIZADO EL TOKEN")
                Logger.log("SE HA COMPLETADO EL JOB DE AUTENTICACIÓN CON CUANTIA")
                Logger.complete()
                isRunning = false
                return
            }
            Logger.warn("NO SE HA PODIDO ACTUALIZAR EL TOKEN DE AUTENTICACIÓN")
            Logger.warn("EL JOB DE AUTENTICACIÓN CON CUANTIA SE HA COMPLETADO PERO SIN EXITO")
            Logger.complete()
            isRunning = false
            return
        }
        Logger.warn("EL JOB DE AUTENTICACIÓN CON CUANTIA AUN ESTA CORRIENDO, SE HA DENEGADO LA OPERACIÓN")
    } catch (err) {
        isRunning = false
        Logger.warn("EL JOB DE AUTENTICACIÓN CON CUANTIA HA FALLADO")
        let message
        let error
        let params
        if (Array.isArray(err)) {
            message = err[0]
            error = err[1]
            params = err[2]
            Logger.error(message, error, params)
            return
        }
        message = "UNKNOW_ERROR"
        error = err
        params = "UNKNOW_PARAMS"
        Logger.error(message, error, params)
    } finally {
        await Logger.save()
    }
}

async function time() {
    let configs = await Configs.findOne({ nameJob: "cuantiaLogin" })
    return configs.cronExpression
}

export default { task, time, name: "cuantiaLogin" }