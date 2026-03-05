
import { connectionsInit } from "../functions/connection";
import { FDB } from "../config/databases/firebird";
import { SYSTEM } from "../functions/logger";
import fs from "fs"
async function init() {
    try {
        const Logger = new SYSTEM("SYSTEM");
        await connectionsInit(Logger)
        const firebird = new FDB()
        await firebird.connect()
        // const sql1 = `
        //     select 
        //         producto_codigo 
        //     from productos_terminados 
        //     inner join productos_terminados_foto 
        //     on 
        //         productos_terminados.codigo_producto = productos_terminados_foto.producto_codigo 
        //     where 
        //         tipo='PV'`
        //     // union all

        // const sql2= `select 
        //         producto_codigo 
        //     from productos_compuestos 
        //     inner join productos_terminados_foto 
        //     on 
        //         productos_compuestos.codigo_producto = productos_terminados_foto.producto_codigo 
        //     where 
        //         tipo='PV'`
        //     // union all

        // const sql3=`select 
        //         producto_codigo 
        //     from productos_servicios 
        //     inner join productos_terminados_foto 
        //     on 
        //     productos_servicios.codigo_producto = productos_terminados_foto.producto_codigo 
        //     where 
        //         tipo='PV'

        //     `
        // const res1 = await firebird.query(sql1)
        // console.log("response1", res1.length) 
        // const res2 = await firebird.query(sql2)
        // console.log("response2", res2.length) 
        // const res3 = await firebird.query(sql3)
        // console.log("response3", res3.length) 

        // let terminados_con =res1.map(item=>item.PRODUCTO_CODIGO)
        // terminados_con = JSON.stringify(terminados_con)
        // terminados_con = terminados_con.replace(/[\[]/g, "(")
        // terminados_con = terminados_con.replace(/[\]]/g, ")")
        // terminados_con = terminados_con.replace(/["]/g, "'")
        // const terminadosSinImgSql = `select codigo_producto from productos_terminados where codigo_producto not in ${terminados_con}`

        // const terminados_sin = await firebird.query(terminadosSinImgSql)

        // console.log("sin img", terminados_sin)

        const productos_terminados_sql = `
        SELECT codigo_producto FROM productos_terminados WHERE NOT EXISTS ( SELECT 1 FROM productos_terminados_foto WHERE productos_terminados_foto.producto_codigo = productos_terminados.codigo_producto and productos_terminados_foto.tipo='PV' )`
        const productos_terminados = await firebird.query(productos_terminados_sql)
        console.log("productos_terminados", productos_terminados.length)

        const productos_compuestos_sql = `
        SELECT codigo_producto FROM productos_compuestos WHERE NOT EXISTS ( SELECT 1 FROM productos_terminados_foto WHERE productos_terminados_foto.producto_codigo = productos_compuestos.codigo_producto and productos_terminados_foto.tipo='PV' )`
        const productos_compuestos = await firebird.query(productos_compuestos_sql)
        console.log("productos_compuestos", productos_compuestos.length)

        const productos_servicios_sql = `
        SELECT codigo_producto FROM productos_servicios WHERE NOT EXISTS ( SELECT 1 FROM productos_terminados_foto WHERE productos_terminados_foto.producto_codigo = productos_servicios.codigo_producto and productos_terminados_foto.tipo='PV' )`
        const productos_servicios = await firebird.query(productos_servicios_sql)
        console.log("productos_servicios", productos_servicios.length)

        let text = "CODIGO\tTIPO\n"

        for (const producto of productos_terminados) {
            text += `${producto.CODIGO_PRODUCTO}\tTERMINADO\n`
        }
        for (const producto of productos_compuestos) {
            text += `${producto.CODIGO_PRODUCTO}\tCOMPUESTO\n`
        }
        for (const producto of productos_servicios) {
            text += `${producto.CODIGO_PRODUCTO}\tSERVICIO\n`
        }

        fs.writeFileSync("./codigosSinImagen.csv", text)

        firebird.detach()
    } catch (error) {
        console.log("err", error)
    }

}
init()