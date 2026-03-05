import { FDB } from "../config/databases/firebird"
import { Data } from "../models/data"
import { LastProducts } from "../models/lastProducts"
import { Configs } from "../models/configs"
import { ssqlCorrelative, ssqlProducts } from "../resources/queries/actPrecios"
import { updateCuantiaProducts } from "../functions/actPrecios"
import { JOB } from "../functions/logger"
import { runSQLPython } from "../utils/callPythonScript"
let isRunning = false
const Firebird = new FDB()


async function task() {
    const Logger = new JOB("actPrecios")
    try {
        if (!isRunning) {
            isRunning = true
            Logger.log("SE HA INICIADO EL JOB DE ACTUALIZACIÓN DE PRECIOS")
            await Firebird.connect()
            const correlativo = (await Firebird.query(ssqlCorrelative))[0].CORRELATIVO
            Logger.log(`SE HA CONSULTADO EL CORRELATIVO: ${correlativo}`)
            const localData = await Data.findOne({}).lean()
            Logger.log(`EL ULTIMO CORRELATIVO GUARDADO ES EL: ${localData.correlative}`)
            if (localData.correlative != correlativo) {
                Logger.log("EL JOB DETECTO UNA NUEVA VENTA, SE INICIARA EL PROCESO DE ACTUALIZACIÓN DE PRECIOS")
                // const products = await Firebird.query(ssqlProducts)
                const products = await runSQLPython(ssqlProducts)
                let productsToUpdate = []
                Logger.log("SE DETERMINARAN LOS PRODUCTOS QUE REQUIEREN ACTUALIZACIÓN")
                for (const product of products) {
                    const localProduct = await LastProducts.findOne({ PRODUCTO_CODIGO: product.PRODUCTO_CODIGO }, { DOCUMENT_TRIGGER: 0, createdAt: 0, updatedAt: 0, _id: 0, __v: 0 }).lean()
                    const compareProduct = { ...product }
                    if (!localProduct) {
                        productsToUpdate.push({
                            ...product
                        })
                    } else if (JSON.stringify(compareProduct) != JSON.stringify(localProduct)) {
                        productsToUpdate.push({
                            ...product
                        })
                    }
                }
                if (!productsToUpdate.length) {
                    Logger.log("NO ES NECESARIO ACTUALIZAR NINGUN PRODUCTO")
                    Logger.log("SE HA COMPLETADO EL JOB DE ACTUALIZACIÓN DE PRECIOS")
                    Logger.complete()
                    await Data.updateOne({}, { $set: { correlative: correlativo } })
                    isRunning = false
                    return
                }
                Logger.log(`SE ACTUALIZARAN LOS SIGUIENTES PRODUCTOS: ${productsToUpdate.map((code) => {
                    return code.PRODUCTO_CODIGO
                })}`)
                const results = await updateCuantiaProducts(productsToUpdate, localData.token)
                Logger.log(`LOS RESULTADOS DE LA ACTUALIZACIÓN SON: COMPLETADOS: ${results.success.toString()}, FALLADOS: ${results.failed.toString()}, NO EVALUADOS: ${results.remaining.toString()}, IGNORADOS: ${results.ignored.toString()}, CREADOS: ${results.created.toString()}`)
                for (const product of products) {
                    const localProduct = await LastProducts.findOne({ PRODUCTO_CODIGO: product.PRODUCTO_CODIGO }, { DOCUMENT_TRIGGER: 0, createdAt: 0, productsToUpdateAt: 0, _id: 0, __v: 0 }).lean()
                    const localDoc = { ...product, DOCUMENT_TRIGGER: correlativo }
                    if (!localProduct) {
                        await LastProducts.create(localDoc)
                    } else if (JSON.stringify(product) != JSON.stringify(localProduct)) {
                        await LastProducts.updateOne({ PRODUCTO_CODIGO: product.PRODUCTO_CODIGO }, { $set: { ...localDoc } })
                    }
                }
                Logger.log("SE HAN GUARDADO LOS PRODUCTOS ACTUALIZADOS")
                Logger.log("SE HA COMPLETADO EL JOB DE ACTUALIZACIÓN DE PRECIOS")
                Logger.complete()
                await Data.updateOne({}, { $set: { correlative: correlativo } })
                isRunning = false
                return
            }
            Logger.log("EL JOB NO DETECTO NINGUNA VENTA")
            Logger.log("SE HA COMPLETADO EL JOB DE ACTUALIZACIÓN DE PRECIOS")
            Logger.complete()
            await Data.updateOne({}, { $set: { correlative: correlativo } })
            isRunning = false
            return
        }
        Logger.warn("EL JOB DE ACTUALIZACIÓN DE PRECIOS AUN ESTA CORRIENDO, SE HA DENEGADO LA OPERACIÓN")
    } catch (err) {
        isRunning = false
        Logger.warn("EL JOB DE ACTUALIZACIÓN DE PRECIOS HA FALLADO")
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
        await Firebird.detach()
        await Logger.save()
    }
}

async function time() {
    let configs = await Configs.findOne({ nameJob: "actPrecios" })
    return configs.cronExpression
}

export default { task, time, name: "actPrecios" }