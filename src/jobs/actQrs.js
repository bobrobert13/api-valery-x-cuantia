import { Configs } from "../models/configs"
import { FDB } from "../config/databases/firebird"
import { generateQrs } from "../functions/actQrs"
import fs from 'fs'
import { JOB } from "../functions/logger"
let isRunning = false
let Firebird = new FDB()
let Logger = new JOB("actQrs")

async function task() {
    try {
        if (!isRunning) {
            isRunning = true
            Logger.log("SE HA INICIADO EL JOB DE ACTUALIZACIÓN DE QRS")
            const ssqlProductosTerminados = `select productos_terminados.codigo_producto from productos_terminados where productos_terminados.codigo_producto not in (select productos_terminados_foto.producto_codigo from productos_terminados_foto) and productos_terminados.estatus = 'A'`
            await Firebird.connect()
            const productosTerminados = await Firebird.query(ssqlProductosTerminados)
            const actStatus = productosTerminados.length != 0 ? true : false
            if (actStatus) {
                let codesQrsInserted = []
                const qrsPaths = await generateQrs(productosTerminados.map((item) => {
                    return item.CODIGO_PRODUCTO
                }), Logger)
                for (const item of qrsPaths) {
                    const image = fs.readFileSync(item[0])
                    const ssql = `insert into productos_terminados_foto (productos_terminados_foto.producto_codigo, productos_terminados_foto.producto_tipo, productos_terminados_foto.tipo, productos_terminados_foto.imagen, productos_terminados_foto.ajuste_total, productos_terminados_foto.propiedades, productos_terminados_foto.imagen_miniatura) values (?, ?, ?, ?, ?, ?, ?) returning productos_terminados_foto.producto_codigo`
                    const params = [item[1], 'T', 'CON', image, 'F', 'AJUSTE=2', image]
                    const codeQrInserted = await Firebird.execute(ssql, params)
                    codesQrsInserted.push(codeQrInserted)
                    Logger.log(`SE HA INSERTADO EL QR DEL PRODUCTO: ${codeQrInserted[0]}`)
                }
                Logger.log(`SE HAN INSERTADO LOS QRS DE LOS SIGUIENTES PRODUCTOS: ${codesQrsInserted.toString()}`)
                Logger.log(`EL JOB DE ACTUALIZACIÓN DE QRS AH TERMINADO`)
                Logger.complete()
                return
            }
            Logger.log(`TODOS LOS PRODUCTOS TIENEN QR`)
            Logger.log(`SE HA COMPLETADO EL JOB DE ACTUALIZACIÓN DE QRS`)
            Logger.complete()
            return
        }
        Logger.warn(" EL JOB DE ACTUALIZACIÓN DE PRECIOS AUN ESTA CORRIENDO, SE HA DENEGADO LA OPERACIÓN ")
    } catch (err) {
        Logger.warn("EL JOB DE ACTUALIZACIÓN DE QRS HA FALLADO")
        if (Array.isArray(err)) {
            Logger.error(err[0], err[1], err[2])
            return
        }
        Logger.error("UNKNOW_ERROR", err, "UNKNOW_PARAMS")
    } finally {
        await Logger.save();
        await Firebird.detach()
        isRunning = false
    }

}

async function time() {
    let configs = await Configs.findOne({ nameJob: "actQrs" })
    return configs.cronExpression
}

export default { task, time, name: "actQrs" }