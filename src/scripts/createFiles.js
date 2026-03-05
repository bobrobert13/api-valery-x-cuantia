import { connectionsInit } from "../functions/connection";
import { SYSTEM } from "../functions/logger";
import { FDB } from "../config/databases/firebird";
import fs from "fs"
import path from "path";
const Logger = new SYSTEM("SYSTEM");
const Firebird = new FDB();

const createFiles = async () => {
    try {
        await connectionsInit(Logger)
        await Firebird.connect()
        const filesPath = path.join(__dirname, "..", "..", "..", "..", "resources", "products")
        const filesDir = fs.readdirSync(filesPath)

        await Firebird.query("delete from productos_terminados_foto where productos_terminados_foto.tipo = 'PV'")

        let insertados = []

        let fallados = []

        for (const dir of filesDir) {

            const filePath = path.join(filesPath, dir)
            const file = fs.readFileSync(filePath)
            const product = dir.split(".")[0]
            const productExist = await Firebird.query(`select productos_terminados.codigo_producto from productos_terminados where productos_terminados.codigo_producto = '${product}'`)

            if (!!productExist.length) {
                const ssql = `insert into productos_terminados_foto (productos_terminados_foto.producto_codigo, productos_terminados_foto.producto_tipo, productos_terminados_foto.tipo, productos_terminados_foto.imagen, productos_terminados_foto.ajuste_total, productos_terminados_foto.propiedades, productos_terminados_foto.imagen_miniatura) values (?, ?, ?, ?, ?, ?, ?) returning productos_terminados_foto.producto_codigo`
                const params = [product, 'T', 'PV', file, 'F', 'AJUSTE=2', file]
                await Firebird.execute(ssql, params)
                console.log(`SE HA INSERTADO LA IMAGEN DEL PRODUCTO ${product}`)
                insertados.push(product)
            } else {
                console.log(`EL PRODUCTO ${product} NO EXISTE`)
                fallados.push(product)
            }
        
        }

    } catch (err) {
        console.log(err)
    } finally {
        await Firebird.detach()
        process.exit()
    }
}

createFiles()