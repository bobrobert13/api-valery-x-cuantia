import { Configs } from "../models/configs"
import { Orders } from "../models/orders"
import { chargeOrders } from "../functions/charguePrs"
import { Data } from "../models/data"
import { LOG } from "../functions/logger"
let isRunning = false

async function task() {
    const Logger = new LOG("chargePrs")
    const localData = await Data.findOne({}).lean()
    try {
        if (!isRunning) {
            isRunning = true
            Logger.log("SE HA INICIADO EL JOB CARGA DE PRESUPUESTOS")
            let orders = await Orders.find({ "presupuesto.status": "awaiting" }).lean()
            if (!orders.length) {
                Logger.log(`NO HAY ORDERNES QUE MARCAR EN CUANTIA`)
                Logger.log(`SE HA COMPLETADO EL JOB DE CARGA DE PRESUPUESTOS`)
                Logger.complete()
                isRunning = false
                return
            }
            orders = orders.map((order) => {
                return {
                    orderNumber: order.orderNumber,
                    presupuesto: {
                        presupuestado: order.presupuesto.presupuestado,
                        correlativo: order.presupuesto.correlativo,
                        documento: order.presupuesto.documento,
                        status: "success"
                    }
                }
            })
            const results = await chargeOrders(orders, localData.token)
            for(const result of results){
                const order = await Orders.findOneAndUpdate({ orderNumber: result.orderNumber }, {
                    $set: {
                        presupuesto: { ...result.presupuesto }
                    }
                })
            }
            Logger.log(`SE HA COMPLETADO EL JOB DE CARGA DE PRESUPUESTOS`)
            Logger.complete()
            isRunning = false
            return
        }
        Logger.warn("EL JOB DE CARGA DE PRESUPUESTOS AUN ESTA CORRIENDO, SE HA DENEGADO LA OPERACIÓN")
    } catch (err) {
        isRunning = false
        Logger.warn("EL JOB DE CARGA DE PRESUPUESTOS HA FALLADO")
        if (Array.isArray(err)) {
            Logger.error(err[0], err[1], err[2])
            return
        }
        Logger.error("UNKNOW_ERROR", err, "UNKNOW_PARAMS")
    } finally {
        await Logger.save()
    }
}

async function time() {
    let configs = await Configs.findOne({ nameJob: "chargePrs" })
    return configs.cronExpression
}

export default { task, time, name: "chargePrs" }