// import needle from "needle"
// import { determinateType } from "../utils/handles"
// import { FDB } from "../config/databases/firebird"
// import { getItemDescriptor } from "@babel/core/lib/config/item"
// const Firebird = new FDB()

// const getOrders = async (token) => {
//     const url = process.env.CUANTIA_URL
//     return needle('post', url, `{"query":"query{ getValeryOrders{ user{fullName, dni, phone, email} price pedido{price totalProductos products{name, quantity, price, salePrice, ref, alterproduct{name, code, price, amount}}} createdAt updatedAt } }"}`, {
//         headers: { 'content-type': 'application/json', 'Authorization': `${token}` }
//     }).then((response) => {
//         return response.body.data.getValeryOrders
//     }).catch((err) => {
//         switch (err.code) {
//             case 'ECONNREFUSED':
//                 throw ["CUANTIA_CONNECT_FAILED", err, url]
//                 break;
//             case 'ECONNRESET':
//                 throw ["CUANTIA_CONNECT_FAILED", err, url]
//                 break;
//             default:
//                 throw ["UNKNOW_ERROR", err, "UNKNOW_PARAMS"]
//                 break;
//         }
//     })
// }

// const processOrdersData = async (ordersData) => {
//     try {
//         await Firebird.connect()
//         let ordersDataProcess = []
//         let productsOrdersData = []
//         let usersOrdersData = []
//         for (const order of ordersData) {
//             let productsData = []
            
//             const pidelo = (await Firebird.query(`select clientes.codigo, clientes.nombre, clientes.telefonos, clientes.contacto from clientes where clientes.codigo = 'J-501544743'`))[0]
//             usersOrdersData.push(pidelo)

//             for (const product of order.pedido[0].products) {
//                 const type = await determinateType(product.ref, Firebird)
//                 if (type == 'T') {
//                     let productData = await Firebird.query(`select 
//                     productos_terminados.codigo_producto,
//                     productos_terminados.nombre,
//                     productos_terminados.unidad,
//                     productos_terminados.costo_unitario,
//                     productos_terminados.costo_calculado,
//                     productos_terminados.costo_promedio,
//                     (productos_terminados.precio_maximo * (1 + productos_terminados.alicuota_iva_compra / 100) ) precio_maximo,
//                     (productos_terminados.precio_oferta * (1 + productos_terminados.alicuota_iva_compra / 100) ) precio_oferta,
//                     (productos_terminados.precio_mayor * (1 + productos_terminados.alicuota_iva_compra / 100) ) precio_mayor,
//                     (productos_terminados.precio_minimo * (1 + productos_terminados.alicuota_iva_compra / 100) ) precio_minimo,
//                     productos_terminados.tipo_precio_venta,
//                     moneda.factor_cambio,
//                     productos_terminados_depositos.existencia_actual,
//                     (productos_terminados.precio_maximo_alt * (1 + productos_terminados.alicuota_iva_compra / 100) ) precio_maximo_alt,
//                     (productos_terminados.precio_oferta_alt * (1 + productos_terminados.alicuota_iva_compra / 100) ) precio_oferta_alt,
//                     (productos_terminados.precio_mayor_alt * (1 + productos_terminados.alicuota_iva_compra / 100) ) precio_mayor_alt,
//                     (productos_terminados.precio_minimo_alt * (1 + productos_terminados.alicuota_iva_compra / 100) ) precio_minimo_alt
//                 from productos_terminados
//                    inner join moneda on (productos_terminados.moneda_codigo = moneda.codigo)
//                    inner join productos_terminados_depositos on (productos_terminados.codigo_producto = productos_terminados_depositos.producto_codigo) where productos_terminados.codigo_producto = '${product.ref}'`)
//                     let priceType
//                     switch (productData[0].TIPO_PRECIO_VENTA) {
//                         case 1:
//                             priceType = "PRECIO_MAXIMO"
//                             break;
//                         case 2:
//                             priceType = "PRECIO_OFERTA"
//                             break;
//                         case 3:
//                             priceType = "PRECIO_MAYOR"
//                             break;
//                         case 4:
//                             priceType = "PRECIO_MINIMO"
//                             break;
//                         case 7:
//                             priceType = "PRECIO_MAXIMO"
//                             break;
//                         default:
//                             priceType = "PRECIO_MAXIMO"
//                             break;
//                     }
//                     productData[0]["UNIDAD_SECUNDARIA"] = product.alterproduct.code
//                     productData[0]["FACTOR_UNIDAD_SECUNDARIA"] = product.alterproduct.amount
//                     if(product.alterproduct.code != '00' || product.alterproduct.code != '01' ){
//                         productData[0]["PRECIO_UNITARIO"] = productData[0][priceType + "_ALT"]   
//                         console.log(productData[0][priceType + "_ALT"])
//                     }else{
//                         productData[0]["PRECIO_UNITARIO"] = productData[0][priceType]
//                     }
//                     productData[0]["PRECIO_UNITARIO"] = productData[0][priceType]
//                     productData[0]["CANTIDAD"] = product.quantity
//                     productsData.push(productData[0])
//                 } else if (type == 'C') {
//                     let productData
//                     let productUnprocessData = await Firebird.query(`select productos_compuestos.codigo_producto, productos_compuestos.nombre, productos_compuestos.tipo_unidad_secundaria, productos_compuestos.unidad, productos_compuestos.unidad_secundaria, productos_compuestos.factor_unidad_secundaria, productos_compuestos.costo_unitario, productos_compuestos.costo_calculado, productos_compuestos.costo_promedio, (productos_compuestos.precio_maximo * (1 + productos_compuestos.alicuota_iva_compra / 100) ) precio_maximo, (productos_compuestos.precio_oferta * (1 + productos_compuestos.alicuota_iva_compra / 100) ) precio_oferta, (productos_compuestos.precio_mayor * (1 + productos_compuestos.alicuota_iva_compra / 100) ) precio_mayor, (productos_compuestos.precio_minimo * (1 + productos_compuestos.alicuota_iva_compra / 100) ) precio_minimo, productos_compuestos.tipo_precio_venta, productos_compuestos.correlativo_partes, productos_terminados_depositos.producto_codigo, productos_terminados_depositos.existencia_actual, moneda.factor_cambio, productos_compuestos_partes.cantidad from productos_compuestos_partes inner join productos_terminados_depositos on (productos_compuestos_partes.parte_producto_codigo = productos_terminados_depositos.producto_codigo) inner join productos_compuestos on (productos_compuestos_partes.correlativo_principal = productos_compuestos.correlativo_partes) inner join moneda on (productos_compuestos.moneda_codigo = moneda.codigo) where productos_compuestos.codigo_producto = '${product.ref}'`)
//                     let productProcessData = {}
//                     let cantidades = []
//                     for (const product of productUnprocessData) {
//                         let priceType
//                         switch (product.TIPO_PRECIO_VENTA) {
//                             case 1:
//                                 priceType = "PRECIO_MAXIMO"
//                                 break;
//                             case 2:
//                                 priceType = "PRECIO_OFERTA"
//                                 break;
//                             case 3:
//                                 priceType = "PRECIO_MAYOR"
//                                 break;
//                             case 4:
//                                 priceType = "PRECIO_MINIMO"
//                                 break;
//                             case 7:
//                                 priceType = "PRECIO_MAXIMO"
//                                 break;
//                             default:
//                                 priceType = "PRECIO_MAXIMO"
//                                 break;
//                         }
//                         if (!productProcessData[product.CODIGO_PRODUCTO]) {
//                             productProcessData[product.CODIGO_PRODUCTO] = {
//                                 CODIGO_PRODUCTO: product.CODIGO_PRODUCTO,
//                                 NOMBRE: product.NOMBRE,
//                                 UNIDAD: product.UNIDAD,
//                                 UNIDAD_SECUNDARIA: product.UNIDAD_SECUNDARIA,
//                                 FACTOR_UNIDAD_SECUNDARIA: product.FACTOR_UNIDAD_SECUNDARIA,
//                                 COSTO_UNITARIO: product.COSTO_UNITARIO,
//                                 COSTO_CALCULADO: product.COSTO_CALCULADO,
//                                 COSTO_PROMEDIO: product.COSTO_PROMEDIO,
//                                 PRECIO_MAXIMO: product.PRECIO_MAXIMO,
//                                 PRECIO_OFERTA: product.PRECIO_OFERTA,
//                                 PRECIO_MAYOR: product.PRECIO_MAYOR,
//                                 PRECIO_MINIMO: product.PRECIO_MINIMO,
//                                 TIPO_PRECIO_VENTA: product.TIPO_PRECIO_VENTA,
//                                 FACTOR_CAMBIO: product.FACTOR_CAMBIO,
//                                 PRECIO_UNITARIO: product[priceType],
//                                 PARTES: [{
//                                     PRODUCTO_CODIGO: product.PRODUCTO_CODIGO,
//                                     EXISTENCIA_ACTUAL: product.EXISTENCIA_ACTUAL,
//                                     CANTIDAD: product.CANTIDAD
//                                 }]
//                             }
//                         } else {
//                             productProcessData[product.CODIGO_PRODUCTO].PARTES.push({
//                                 PRODUCTO_CODIGO: product.PRODUCTO_CODIGO,
//                                 EXISTENCIA_ACTUAL: product.EXISTENCIA_ACTUAL,
//                                 CANTIDAD: product.CANTIDAD
//                             })
//                         }
//                     }
//                     productProcessData = productProcessData[productUnprocessData[0].CODIGO_PRODUCTO]
//                     for (const item of productProcessData.PARTES) {
//                         let cantidad = item.EXISTENCIA_ACTUAL / item.CANTIDAD
//                         cantidades.push(cantidad)
//                     }

//                     productData = {
//                         CODIGO_PRODUCTO: productProcessData.CODIGO_PRODUCTO,
//                         NOMBRE: productProcessData.NOMBRE,
//                         UNIDAD: productProcessData.UNIDAD,
//                         UNIDAD_SECUNDARIA: productProcessData.UNIDAD_SECUNDARIA,
//                         FACTOR_UNIDAD_SECUNDARIA: productProcessData.FACTOR_UNIDAD_SECUNDARIA,
//                         COSTO_UNITARIO: productProcessData.COSTO_UNITARIO,
//                         COSTO_CALCULADO: productProcessData.COSTO_CALCULADO,
//                         COSTO_PROMEDIO: productProcessData.COSTO_PROMEDIO,
//                         PRECIO_MAXIMO: productProcessData.PRECIO_MAXIMO,
//                         PRECIO_OFERTA: productProcessData.PRECIO_OFERTA,
//                         PRECIO_MAYOR: productProcessData.PRECIO_MAYOR,
//                         PRECIO_MINIMO: productProcessData.PRECIO_MINIMO,
//                         TIPO_PRECIO_VENTA: productProcessData.TIPO_PRECIO_VENTA,
//                         PRECIO_UNITARIO: productProcessData.PRECIO_UNITARIO,
//                         FACTOR_CAMBIO: productProcessData.FACTOR_CAMBIO,
//                         EXISTENCIA_ACTUAL: parseInt(((Math.min(...cantidades)).toFixed())),
//                         CANTIDAD: product.quantity
//                     }
//                     productsData.push(productData)
//                 } else {
//                     console.log("INEXISTENTE")
//                 }
//             }
//             productsOrdersData.push(productsData)
//         }

//         for (let i = 0; i < usersOrdersData.length; i++) {
//             ordersDataProcess.push([usersOrdersData[i], productsOrdersData[i]])
//         }
//         return ordersDataProcess

//     } catch (err) {
//         if (Array.isArray(err)) {
//             throw err
//         } else {
//             throw ["PROCESS_DATA_ERROR", err.toString(), ordersData.toString()]
//         }
//     }
// }

// export { getOrders, processOrdersData }