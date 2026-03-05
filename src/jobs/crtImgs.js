import { FDB } from "../config/databases/firebird"
import { Data } from "../models/data"
import { Configs } from "../models/configs"
import { JOB } from "../functions/logger"
import { queryMissingImages, sendMissingImages } from "../functions/crtImgs"
import fs from "fs"
let isRunning = false
const Firebird = new FDB()
const Logger = new JOB("crtImgs")

async function task() {
    const Firebird = new FDB()
    const Logger = new JOB("crtImgs")
    try {
        if (!isRunning) {
            isRunning = true
            await Firebird.connect()
            const localData = await Data.findOne({}).lean()

            const refs = await queryMissingImages(localData.token)
            if (refs.length==0){
                Logger.log(`NO HAY PRODUCTOS SIN IMAGEN`)
                isRunning = false
                return
            }
            Logger.log(`PRODUCTOS EN CUANTIA SIN IMAGEN: ${refs.toString()}`)

            // const refs = ["7596077001765"]
            let String = JSON.stringify(refs)
            String = String.replace(/[\[]/g, "(")
            String = String.replace(/[\]]/g, ")")
            String = String.replace(/["]/g, "'")
            
            const sql = ` select imagen, producto_codigo from productos_terminados_foto where tipo='PV' and producto_codigo in ${String}`

            const results = await Firebird.query(sql)
            Logger.log(`SE HAN ENCONTRADO ${results.length} IMAGENES EN VALERY`)
            const found = []
            const notFound = [...refs]
            for ( const i in results){
                Logger.log(`SE HA ENCONTRADO IMAGEN PARA EL PRODUCTO: ${results[i].PRODUCTO_CODIGO} \n Imagen: ${results[i].IMAGEN.byteLength} bytes`)
                const index = notFound.indexOf(results[i].PRODUCTO_CODIGO)
                if (index >=0){
                    notFound.splice(index, 1)
                    found.push(results[i].PRODUCTO_CODIGO)
                }
                
                fs.writeFileSync("img.jpg", await Firebird.buffer(results[i].IMAGEN))
                const imagenFinal= fs.readFileSync("img.jpg")
                
                results[i].IMAGEN = imagenFinal
                // console.log("buff",imagenFinal.byteLength)

            }
            // console.log("not found", notFound, notFound.length + results.length, refs.length )
            Logger.warn(`NO SE CONSIGUIERON IMAGENES PARA LOS SIGUIENTES PRODUCTOS: ${notFound.toString()}`)
            Logger.log(`SE ENVIARAN LAS IMAGENES PARA LOS SIGUIENTES PRODUCTOS: ${found.toString()}`)
            await sendMissingImages(results, localData.token)

            

            Logger.log("EL JOB DE IMPORTACION DE IMAGENES HA COMPLETADO")
            Logger.complete()
            isRunning = false
            return 
        }
        Logger.warn("EL JOB DE CREACIÓN DE IMAGENES AUN ESTA CORRIENDO, SE HA DENEGADO LA OPERACIÓN")
    } catch (err) {
        isRunning = false
        let message
        let error
        let params
        if (Array.isArray(err)) {
            Logger.warn("EL JOB DE IMPORTACION DE IMAGENES AH FALLADO")
            message = err[0]
            error = err[1]
            params = err[2]
            Logger.error(message, error, params)
            
            return
        }
        Logger.warn("EL JOB DE IMPORTACION DE IMAGENES AH FALLADO")
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
    let configs = await Configs.findOne({ nameJob: "crtImgs" })
    return configs.cronExpression
}

export default { task, time, name: "crtImgs" }