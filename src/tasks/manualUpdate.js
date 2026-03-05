import { Data } from "../models/data";
import { LastProducts } from "../models/lastProducts";
import { JOB } from "../functions/logger";
import { filteredProductsAndImgs } from "../resources/queries/actPrecios";
import { runSQLPython } from "../utils/callPythonScript";
import { updateCuantiaProducts } from "../functions/actPrecios";
import { sendMissingImages } from "../functions/crtImgs";
import fs from "fs"

import { FDB } from "../config/databases/firebird";
const Firebird = new FDB()
const Logger = new JOB("manualUpdate");

export default function (reqBody) {
    return new Promise(async (resolve, reject) => {
        try {

            const {productsSql, imagesSql} = filteredProductsAndImgs(reqBody.data)

            const products = await runSQLPython(productsSql)
            const localData = await Data.findOne({}).lean()
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
            if (productsToUpdate.length) {
                Logger.log(`SE ACTUALIZARAN LOS SIGUIENTES PRODUCTOS: ${productsToUpdate.map((code) => {
                    return code.PRODUCTO_CODIGO
                })}`)
                const results = await updateCuantiaProducts(productsToUpdate, localData.token)
                Logger.log(`LOS RESULTADOS DE LA ACTUALIZACIÓN SON: COMPLETADOS: ${results.success.toString()}, FALLADOS: ${results.failed.toString()}, NO EVALUADOS: ${results.remaining.toString()}, IGNORADOS: ${results.ignored.toString()}, CREADOS: ${results.created.toString()}`)
                for (const product of products) {
                    await LastProducts.findOneAndUpdate({ PRODUCTO_CODIGO: product.PRODUCTO_CODIGO }, {$set:{ ...product, DOCUMENT_TRIGGER:0}}, { upsert:true })
                }

            }

            //ahora las imagenes
            await Firebird.connect()
            const results = await Firebird.query(imagesSql)
            Logger.log(`CONSULTA FIREBIRD EXITOSA`)
            const found = []
            const notFound = [...reqBody.data]
            for (const i in results) {
                const index = notFound.indexOf(results[i].PRODUCTO_CODIGO)
                if (index >= 0) {
                    notFound.splice(index, 1)
                    found.push(results[i].PRODUCTO_CODIGO)
                }
                fs.writeFileSync("img.jpg", await Firebird.buffer(results[i].IMAGEN))
                const imagenFinal = fs.readFileSync("img.jpg")
                results[i].IMAGEN = imagenFinal
                // console.log("buff",imagenFinal.byteLength)
            }
            // console.log("not found", notFound, notFound.length + results.length, refs.length )
            Logger.warn(`NO SE CONSIGUIERON IMAGENES PARA LOS SIGUIENTES PRODUCTOS: ${notFound.toString()}`)
            Logger.log(`SE ENVIARAN LAS IMAGENES PARA LOS SIGUIENTES PRODUCTOS: ${found.toString()}`)
            await sendMissingImages(results, localData.token)
            Logger.log("EL JOB DE IMPORTACION DE IMAGENES HA COMPLETADO")
            Logger.complete()



            resolve(true);
        } catch (error) {
            console.log(error)
            reject(error);
        }
    });
}
