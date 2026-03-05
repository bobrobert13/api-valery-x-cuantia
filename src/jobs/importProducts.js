import { Configs } from "../models/configs"
import { FDB } from "../config/databases/firebird"
import { JOB } from "../functions/logger"
import { processStocks } from "../functions/importProducts"
import { Products } from "../models/products"
let isRunning = false
let Firebird = new FDB()
let Logger = new JOB("importProducts")

async function task(si) {
    try {
        if (!isRunning) {
            isRunning = true
            await Firebird.connect()
            Logger.log("SE HA INICIADO EL JOB DE IMPORTACIÓN DE PRODUCTOS")
            const products = await Firebird.query(`
            select
                productos_terminados.codigo_producto,
                productos_terminados.nombre nombre_producto,
                departamentos1.nombre departamento_padre,
                departamentos.nombre departamento_hijo,
                productos_terminados_depositos.existencia_actual,
                productos_terminados_depositos.deposito_codigo,
                productos_terminados.estatus
            from departamentos departamentos1
                inner join departamentos on (departamentos1.codigo = departamentos.departamento_padre)
                inner join productos_terminados on (departamentos.codigo = productos_terminados.departamento_codigo)
                inner join productos_terminados_depositos on (productos_terminados.codigo_producto = productos_terminados_depositos.producto_codigo)`)
            Logger.log("SE CONSULTARON TODOS LOS PRODUCTOS TERMINADOS")
            const processProducts = processStocks(products)
            Logger.log("SE PROCESARON TODOS LOS STOCKS DE LOS PRODUCTOS")
            
            if (!await Products.find()) {
                await Products.insertMany(processProducts)
            } else {
                for (const product of processProducts) {
                    const localProduct = await Products.findOne({ CODIGO_PRODUCTO: product.CODIGO_PRODUCTO }, { createdAt: 0, updatedAt: 0, _id: 0, __v: 0, SENSITIVE: 0 }).lean()
                    if (!localProduct) {
                        await Products.create(product)
                    } else if (JSON.stringify(product) != JSON.stringify(localProduct)) {
                        await Products.updateOne({ CODIGO_PRODUCTO: product.CODIGO_PRODUCTO }, { $set: product })
                    }
                }
            }

            Logger.log("SE HA COMPLETADO EL JOB DE IMPORTACIÓN DE PRODUCTOS")
            Logger.complete()
            isRunning = false
            return
        }
        Logger.warn(" EL JOB DE IMPORTACIÓN DE PRODUCTOS AUN ESTA CORRIENDO, SE HA DENEGADO LA OPERACIÓN")
    } catch (err) {
        isRunning = false
        Logger.warn("EL JOB DE ACTUALIZACIÓN DE IMPORTACIÓN DE PRODUCTOS HA FALLADO")
        if (Array.isArray(err)) {
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
    let configs = await Configs.findOne({ nameJob: "importProducts" })
    return configs.cronExpression
}

export default { task, time, name: "importProducts" }