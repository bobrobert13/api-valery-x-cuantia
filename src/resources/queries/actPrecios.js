function filteredProductsAndImgs(refs){
    console.log(refs)
    let String = JSON.stringify(refs)
    String = String.replace(/[\[]/g, "(")
    String = String.replace(/[\]]/g, ")")
    String = String.replace(/["]/g, "'")
    console.log(String)
    const productsSql = `
    select 
        productos_terminados.codigo_producto producto_codigo,
        sum( productos_terminados_depositos.existencia_actual ) sum_of_existencia_actual,
        productos_terminados.unidad_secundaria,
        unidades.nombre nombre_unidad_secundaria,
        productos_terminados.factor_unidad_secundaria,
        ( productos_terminados.precio_minimo * (1 + productos_terminados.alicuota_iva_compra / 100)) precio_real,
        ( productos_terminados.precio_minimo_alt * (1 + productos_terminados.alicuota_iva_compra / 100)) precio_real_alt,
        ( productos_terminados.precio_minimo - ((productos_terminados.precio_minimo - productos_terminados.costo_unitario) * 0.1)) precio_oferta,
        ( productos_terminados.precio_minimo_alt - ((productos_terminados.precio_minimo_alt - productos_terminados.costo_unitario) * 0.1)) precio_oferta_alt,
        ( productos_terminados.precio_minimo) precio_real_sin_iva,
        productos_terminados.estatus,
        departamento_padre.nombre departamento_padre,
        departamento_hijo.nombre departamento_hijo,
        productos_terminados.marca,
        productos_terminados.modelo,
        productos_terminados.nombre,
        productos_terminados.descripcion,
        productos_terminados.nombre_corto
    from productos_terminados
        inner join productos_terminados_depositos on (productos_terminados_depositos.producto_codigo = productos_terminados.codigo_producto)
        inner join unidades on (productos_terminados.unidad_secundaria = unidades.codigo)
        inner join departamentos departamento_hijo on (productos_terminados.departamento_codigo = departamento_hijo.codigo)
        inner join departamentos departamento_padre on (departamento_hijo.departamento_padre = departamento_padre.codigo)
    where productos_terminados.codigo_producto in ${String}
    group by
        productos_terminados.codigo_producto,
        productos_terminados.unidad_secundaria,
        unidades.nombre,
        productos_terminados.factor_unidad_secundaria,
        ( productos_terminados.precio_minimo * (1 + productos_terminados.alicuota_iva_compra / 100)) ,
        ( productos_terminados.precio_minimo_alt * (1 + productos_terminados.alicuota_iva_compra / 100)) ,
        ( productos_terminados.precio_minimo - ((productos_terminados.precio_minimo - productos_terminados.costo_unitario) * 0.1)) ,
        ( productos_terminados.precio_minimo_alt - ((productos_terminados.precio_minimo_alt - productos_terminados.costo_unitario) * 0.1)) ,
        ( productos_terminados.precio_minimo),
        productos_terminados.estatus,
        departamento_padre.nombre,
        departamento_hijo.nombre,
        productos_terminados.marca,
        productos_terminados.modelo,
        productos_terminados.nombre,
        productos_terminados.descripcion,
        productos_terminados.nombre_corto
    union all
    select 
        productos_compuestos.codigo_producto producto_codigo,
        trunc (min(productos_terminados_depositos.existencia_actual / productos_compuestos_partes.cantidad) ) sum_of_existencia_actual,
        productos_compuestos.unidad_secundaria,
        unidades.nombre nombre_unidad_secundaria,
        productos_compuestos.factor_unidad_secundaria,
        ( productos_compuestos.precio_minimo * (1 + productos_compuestos.alicuota_iva_compra / 100)) precio_real,
        (0) precio_real_alt,
        ( productos_compuestos.precio_minimo - ((productos_compuestos.precio_minimo - productos_compuestos.costo_unitario) * 0.1)) precio_oferta,
        (0) precio_oferta_alt,
        ( productos_compuestos.precio_minimo) precio_real_sin_iva,
        productos_compuestos.estatus,
        departamento_padre.nombre departamento_padre,
        departamento_hijo.nombre departamento_hijo,
        productos_compuestos.marca,
        productos_compuestos.modelo,
        productos_compuestos.nombre,
        productos_compuestos.descripcion,
        productos_compuestos.nombre_corto
    from productos_compuestos
        inner join unidades on (unidades.codigo = productos_compuestos.unidad_secundaria)
        inner join productos_compuestos_partes on (productos_compuestos.correlativo_partes = productos_compuestos_partes.correlativo_principal)
        inner join productos_terminados_depositos on (productos_compuestos_partes.parte_producto_codigo = productos_terminados_depositos.producto_codigo)
        inner join departamentos departamento_hijo on (productos_compuestos.departamento_codigo = departamento_hijo.codigo)
        inner join departamentos departamento_padre on (departamento_hijo.departamento_padre = departamento_padre.codigo)
        where productos_compuestos.codigo_producto in ${String}
    group by
        productos_compuestos.codigo_producto,
        productos_compuestos.unidad_secundaria,
        unidades.nombre,
        productos_compuestos.factor_unidad_secundaria,
        ( productos_compuestos.precio_minimo * (1 + productos_compuestos.alicuota_iva_compra / 100)),
        ( productos_compuestos.precio_minimo - ((productos_compuestos.precio_minimo - productos_compuestos.costo_unitario) * 0.1)),
        ( productos_compuestos.precio_minimo),
        productos_compuestos.estatus,
        departamento_padre.nombre,
        departamento_hijo.nombre,
        productos_compuestos.marca,
        productos_compuestos.modelo,
        productos_compuestos.nombre,
        productos_compuestos.descripcion,
        productos_compuestos.nombre_corto
    union all
    select 
        productos_servicios.codigo_producto producto_codigo,
        (99999999) sum_of_existencia_actual,
        productos_servicios.unidad_secundaria,
        unidades.nombre nombre_unidad_secundaria,
        productos_servicios.factor_unidad_secundaria,
        ( productos_servicios.precio_minimo * (1 + productos_servicios.alicuota_impuesto_compra / 100)) precio_real,
        (0) precio_real_alt,
        ( productos_servicios.precio_minimo - ((productos_servicios.precio_minimo - productos_servicios.costo_unitario) * 0.1)) precio_oferta,
        (0) precio_oferta_alt,
        ( productos_servicios.precio_minimo ) precio_real_sin_iva,
        productos_servicios.estatus,
        departamento_padre.nombre departamento_padre,
        departamento_hijo.nombre departamento_hijo,
        productos_servicios.marca,
        productos_servicios.modelo,
        productos_servicios.nombre,
        productos_servicios.nombre descripcion,
        productos_servicios.nombre_corto
    from productos_servicios 
        inner join unidades on (productos_servicios.unidad_secundaria = unidades.codigo)
        inner join departamentos departamento_hijo on (productos_servicios.departamento_codigo = departamento_hijo.codigo)
        inner join departamentos departamento_padre on (departamento_hijo.departamento_padre = departamento_padre.codigo)
    where productos_servicios.codigo_producto in ${String}
    group by
        productos_servicios.codigo_producto,
        productos_servicios.unidad_secundaria,
        unidades.nombre,
        productos_servicios.factor_unidad_secundaria,
        ( productos_servicios.precio_minimo * (1 + productos_servicios.alicuota_impuesto_compra / 100)) ,
        ( productos_servicios.precio_minimo - ((productos_servicios.precio_minimo - productos_servicios.costo_unitario) * 0.1)) ,
        ( productos_servicios.precio_minimo ) ,
        productos_servicios.estatus,
        departamento_padre.nombre,
        departamento_hijo.nombre,
        productos_servicios.marca,
        productos_servicios.modelo,
        productos_servicios.nombre,
        productos_servicios.nombre,
        productos_servicios.nombre_corto
`
    const imagesSql = ` select imagen, producto_codigo from productos_terminados_foto where tipo='PV' and producto_codigo in ${String}`
    return {productsSql, imagesSql}
}
const ssqlProducts = `
select 
    productos_terminados.codigo_producto producto_codigo,
    sum( productos_terminados_depositos.existencia_actual ) sum_of_existencia_actual,
    productos_terminados.unidad_secundaria,
    unidades.nombre nombre_unidad_secundaria,
    productos_terminados.factor_unidad_secundaria,
    ( productos_terminados.precio_minimo * (1 + productos_terminados.alicuota_iva_compra / 100)) precio_real,
    ( productos_terminados.precio_minimo_alt * (1 + productos_terminados.alicuota_iva_compra / 100)) precio_real_alt,
    ( productos_terminados.precio_minimo - ((productos_terminados.precio_minimo - productos_terminados.costo_unitario) * 0.1)) precio_oferta,
    ( productos_terminados.precio_minimo_alt - ((productos_terminados.precio_minimo_alt - productos_terminados.costo_unitario) * 0.1)) precio_oferta_alt,
    ( productos_terminados.precio_minimo) precio_real_sin_iva,
    productos_terminados.estatus,
    departamento_padre.nombre departamento_padre,
    departamento_hijo.nombre departamento_hijo,
    productos_terminados.marca,
    productos_terminados.modelo,
    productos_terminados.nombre,
    productos_terminados.descripcion,
    productos_terminados.nombre_corto
from productos_terminados
    inner join productos_terminados_depositos on (productos_terminados_depositos.producto_codigo = productos_terminados.codigo_producto)
    inner join unidades on (productos_terminados.unidad_secundaria = unidades.codigo)
    inner join departamentos departamento_hijo on (productos_terminados.departamento_codigo = departamento_hijo.codigo)
    inner join departamentos departamento_padre on (departamento_hijo.departamento_padre = departamento_padre.codigo)
group by
    productos_terminados.codigo_producto,
    productos_terminados.unidad_secundaria,
    unidades.nombre,
    productos_terminados.factor_unidad_secundaria,
    ( productos_terminados.precio_minimo * (1 + productos_terminados.alicuota_iva_compra / 100)) ,
    ( productos_terminados.precio_minimo_alt * (1 + productos_terminados.alicuota_iva_compra / 100)) ,
    ( productos_terminados.precio_minimo - ((productos_terminados.precio_minimo - productos_terminados.costo_unitario) * 0.1)) ,
    ( productos_terminados.precio_minimo_alt - ((productos_terminados.precio_minimo_alt - productos_terminados.costo_unitario) * 0.1)) ,
    ( productos_terminados.precio_minimo),
    productos_terminados.estatus,
    departamento_padre.nombre,
    departamento_hijo.nombre,
    productos_terminados.marca,
    productos_terminados.modelo,
    productos_terminados.nombre,
    productos_terminados.descripcion,
    productos_terminados.nombre_corto
union all
select 
    productos_compuestos.codigo_producto producto_codigo,
    trunc (min(productos_terminados_depositos.existencia_actual / productos_compuestos_partes.cantidad) ) sum_of_existencia_actual,
    productos_compuestos.unidad_secundaria,
    unidades.nombre nombre_unidad_secundaria,
    productos_compuestos.factor_unidad_secundaria,
    ( productos_compuestos.precio_minimo * (1 + productos_compuestos.alicuota_iva_compra / 100)) precio_real,
    (0) precio_real_alt,
    ( productos_compuestos.precio_minimo - ((productos_compuestos.precio_minimo - productos_compuestos.costo_unitario) * 0.1)) precio_oferta,
    (0) precio_oferta_alt,
    ( productos_compuestos.precio_minimo) precio_real_sin_iva,
    productos_compuestos.estatus,
    departamento_padre.nombre departamento_padre,
    departamento_hijo.nombre departamento_hijo,
    productos_compuestos.marca,
    productos_compuestos.modelo,
    productos_compuestos.nombre,
    productos_compuestos.descripcion,
    productos_compuestos.nombre_corto
from productos_compuestos
    inner join unidades on (unidades.codigo = productos_compuestos.unidad_secundaria)
    inner join productos_compuestos_partes on (productos_compuestos.correlativo_partes = productos_compuestos_partes.correlativo_principal)
    inner join productos_terminados_depositos on (productos_compuestos_partes.parte_producto_codigo = productos_terminados_depositos.producto_codigo)
    inner join departamentos departamento_hijo on (productos_compuestos.departamento_codigo = departamento_hijo.codigo)
    inner join departamentos departamento_padre on (departamento_hijo.departamento_padre = departamento_padre.codigo)
group by
    productos_compuestos.codigo_producto,
    productos_compuestos.unidad_secundaria,
    unidades.nombre,
    productos_compuestos.factor_unidad_secundaria,
    ( productos_compuestos.precio_minimo * (1 + productos_compuestos.alicuota_iva_compra / 100)),
    ( productos_compuestos.precio_minimo - ((productos_compuestos.precio_minimo - productos_compuestos.costo_unitario) * 0.1)) ,
    ( productos_compuestos.precio_minimo),
    productos_compuestos.estatus,
    departamento_padre.nombre,
    departamento_hijo.nombre,
    productos_compuestos.marca,
    productos_compuestos.modelo,
    productos_compuestos.nombre,
    productos_compuestos.descripcion,
    productos_compuestos.nombre_corto
union all
select 
    productos_servicios.codigo_producto producto_codigo,
    (99999999) sum_of_existencia_actual,
    productos_servicios.unidad_secundaria,
    unidades.nombre nombre_unidad_secundaria,
    productos_servicios.factor_unidad_secundaria,
    ( productos_servicios.precio_minimo * (1 + productos_servicios.alicuota_impuesto_compra / 100)) precio_real,
    (0) precio_real_alt,
    ( productos_servicios.precio_minimo - ((productos_servicios.precio_minimo - productos_servicios.costo_unitario) * 0.1)) precio_oferta,
    (0) precio_oferta_alt,
    ( productos_servicios.precio_minimo ) precio_real_sin_iva,
    productos_servicios.estatus,
    departamento_padre.nombre departamento_padre,
    departamento_hijo.nombre departamento_hijo,
    productos_servicios.marca,
    productos_servicios.modelo,
    productos_servicios.nombre,
    productos_servicios.nombre descripcion,
    productos_servicios.nombre_corto
from productos_servicios 
    inner join unidades on (productos_servicios.unidad_secundaria = unidades.codigo)
    inner join departamentos departamento_hijo on (productos_servicios.departamento_codigo = departamento_hijo.codigo)
    inner join departamentos departamento_padre on (departamento_hijo.departamento_padre = departamento_padre.codigo)
group by
    productos_servicios.codigo_producto,
    productos_servicios.unidad_secundaria,
    unidades.nombre,
    productos_servicios.factor_unidad_secundaria,
    ( productos_servicios.precio_minimo * (1 + productos_servicios.alicuota_impuesto_compra / 100)) ,
    ( productos_servicios.precio_minimo - ((productos_servicios.precio_minimo - productos_servicios.costo_unitario) * 0.1)) ,
    ( productos_servicios.precio_minimo ) ,
    productos_servicios.estatus,
    departamento_padre.nombre,
    departamento_hijo.nombre,
    productos_servicios.marca,
    productos_servicios.modelo,
    productos_servicios.nombre,
    productos_servicios.nombre,
    productos_servicios.nombre_corto
`

const ssqlCorrelative = `SELECT CORRELATIVO FROM VENTAS WHERE CORRELATIVO = (SELECT MAX(CORRELATIVO) FROM VENTAS WHERE DOCUMENTO != '' AND LEFT(DOCUMENTO,1) != '*')`

export {ssqlCorrelative, ssqlProducts, filteredProductsAndImgs}




// vieja
// select 
//     productos_terminados.codigo_producto producto_codigo,
//     sum( productos_terminados_depositos.existencia_actual ) sum_of_existencia_actual,
//     productos_terminados.unidad_secundaria,
//     unidades.nombre nombre_unidad_secundaria,
//     productos_terminados.factor_unidad_secundaria,
//     (iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo, productos_terminados.precio_maximo), productos_terminados.precio_minimo), productos_terminados.precio_mayor), productos_terminados.precio_oferta), productos_terminados.precio_maximo ) * (1 + productos_terminados.alicuota_iva_compra / 100) ) precio_real,
//     (iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo_alt, productos_terminados.precio_maximo_alt), productos_terminados.precio_minimo_alt), productos_terminados.precio_mayor_alt), productos_terminados.precio_oferta_alt), productos_terminados.precio_maximo_alt ) * (1 + productos_terminados.alicuota_iva_compra / 100) ) precio_real_alt,
//     (productos_terminados.precio_oferta * (1 + productos_terminados.alicuota_iva_compra / 100)) precio_oferta,
//     (productos_terminados.precio_oferta_alt * (1 + productos_terminados.alicuota_iva_compra / 100)) precio_oferta_alt,
//     productos_terminados.estatus                   
// from productos_terminados_depositos
//     inner join productos_terminados on (productos_terminados_depositos.producto_codigo = productos_terminados.codigo_producto)
//     inner join unidades on (productos_terminados.unidad_secundaria = unidades.codigo)
// group by
//     productos_terminados.codigo_producto,
//     productos_terminados.unidad_secundaria,
//     unidades.nombre,
//     productos_terminados.factor_unidad_secundaria,
//     (iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo, productos_terminados.precio_maximo), productos_terminados.precio_minimo), productos_terminados.precio_mayor), productos_terminados.precio_oferta), productos_terminados.precio_maximo ) * (1 + productos_terminados.alicuota_iva_compra / 100) ), (iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo_alt, productos_terminados.precio_maximo_alt), productos_terminados.precio_minimo_alt), productos_terminados.precio_mayor_alt), productos_terminados.precio_oferta_alt), productos_terminados.precio_maximo_alt ) * (1 + productos_terminados.alicuota_iva_compra / 100) ),
//     (productos_terminados.precio_oferta * (1 + productos_terminados.alicuota_iva_compra / 100)),
//     (productos_terminados.precio_oferta_alt * (1 + productos_terminados.alicuota_iva_compra / 100)), 
//     productos_terminados.estatus
// union all
// select 
//     productos_compuestos.codigo_producto producto_codigo,
//     trunc (min(productos_terminados_depositos.existencia_actual / productos_compuestos_partes.cantidad) ) sum_of_existencia_actual,
//     productos_compuestos.unidad_secundaria,
//     unidades.nombre nombre_unidad_secundaria,
//     productos_compuestos.factor_unidad_secundaria,
//     (iif( productos_compuestos.tipo_precio_venta = '1', iif(productos_compuestos.tipo_precio_venta = '2', iif(productos_compuestos.tipo_precio_venta = '3', iif(productos_compuestos.tipo_precio_venta = '4', iif(productos_compuestos.tipo_precio_venta = '7', productos_compuestos.precio_maximo, productos_compuestos.precio_maximo), productos_compuestos.precio_minimo), productos_compuestos.precio_mayor), productos_compuestos.precio_oferta), productos_compuestos.precio_maximo ) * (1 + productos_compuestos.alicuota_iva_compra / 100) ) precio_real,
//     (0) precio_real_alt,
//     (productos_compuestos.precio_oferta * (1 + productos_compuestos.alicuota_iva_compra / 100)) precio_oferta,
//     (0) precio_oferta_alt,
//     productos_compuestos.estatus
// from unidades
//     inner join productos_compuestos on (unidades.codigo = productos_compuestos.unidad_secundaria)
//     inner join productos_compuestos_partes on (productos_compuestos.correlativo_partes = productos_compuestos_partes.correlativo_principal)
//     inner join productos_terminados_depositos on (productos_compuestos_partes.parte_producto_codigo = productos_terminados_depositos.producto_codigo)
// group by
//     productos_compuestos.codigo_producto,
//     productos_compuestos.unidad_secundaria,
//     unidades.nombre,
//     productos_compuestos.factor_unidad_secundaria,
//     (iif( productos_compuestos.tipo_precio_venta = '1', iif(productos_compuestos.tipo_precio_venta = '2', iif(productos_compuestos.tipo_precio_venta = '3', iif(productos_compuestos.tipo_precio_venta = '4', iif(productos_compuestos.tipo_precio_venta = '7', productos_compuestos.precio_maximo, productos_compuestos.precio_maximo), productos_compuestos.precio_minimo), productos_compuestos.precio_mayor), productos_compuestos.precio_oferta), productos_compuestos.precio_maximo ) * (1 + productos_compuestos.alicuota_iva_compra / 100) ),
//     (productos_compuestos.precio_oferta * (1 + productos_compuestos.alicuota_iva_compra / 100)), 
//     productos_compuestos.estatus 
// order by 9


// nueva

// select
//     productos_terminados.codigo_producto producto_codigo,
//     round(sum( productos_terminados_depositos.existencia_actual ) , 2 ) sum_of_existencia_actual,
//     productos_terminados.unidad_secundaria,
//     unidades.nombre nombre_unidad_secundaria,
//     productos_terminados.factor_unidad_secundaria,
//     round((iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo, productos_terminados.precio_maximo), productos_terminados.precio_minimo), productos_terminados.precio_mayor), productos_terminados.precio_oferta), productos_terminados.precio_maximo ) * (1 + productos_terminados.alicuota_iva_compra / 100) ), 2 ) precio_real,
//     round((iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo_alt, productos_terminados.precio_maximo_alt), productos_terminados.precio_minimo_alt), productos_terminados.precio_mayor_alt), productos_terminados.precio_oferta_alt), productos_terminados.precio_maximo_alt ) * (1 + productos_terminados.alicuota_iva_compra / 100) ) , 2 ) precio_real_alt,
//     round((productos_terminados.precio_oferta * (1 + productos_terminados.alicuota_iva_compra / 100)), 2 ) precio_oferta,
//     round((productos_terminados.precio_oferta_alt * (1 + productos_terminados.alicuota_iva_compra / 100)), 2 ) precio_oferta_alt,
//     productos_terminados.estatus                   
// from productos_terminados_depositos
//     inner join productos_terminados on (productos_terminados_depositos.producto_codigo = productos_terminados.codigo_producto)
//     inner join unidades on (productos_terminados.unidad_secundaria = unidades.codigo)
// group by
//     productos_terminados.codigo_producto,
//     productos_terminados.unidad_secundaria,
//     unidades.nombre,
//     productos_terminados.factor_unidad_secundaria,
//     (iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo, productos_terminados.precio_maximo), productos_terminados.precio_minimo), productos_terminados.precio_mayor), productos_terminados.precio_oferta), productos_terminados.precio_maximo ) * (1 + productos_terminados.alicuota_iva_compra / 100) ), (iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo_alt, productos_terminados.precio_maximo_alt), productos_terminados.precio_minimo_alt), productos_terminados.precio_mayor_alt), productos_terminados.precio_oferta_alt), productos_terminados.precio_maximo_alt ) * (1 + productos_terminados.alicuota_iva_compra / 100) ),
//     (productos_terminados.precio_oferta * (1 + productos_terminados.alicuota_iva_compra / 100)),
//     (productos_terminados.precio_oferta_alt * (1 + productos_terminados.alicuota_iva_compra / 100)), 
//     productos_terminados.estatus
// union all
// select 
//     productos_compuestos.codigo_producto producto_codigo,
//     trunc (min(productos_terminados_depositos.existencia_actual / productos_compuestos_partes.cantidad) ) sum_of_existencia_actual,
//     productos_compuestos.unidad_secundaria,
//     unidades.nombre nombre_unidad_secundaria,
//     productos_compuestos.factor_unidad_secundaria,
//     round((iif( productos_compuestos.tipo_precio_venta = '1', iif(productos_compuestos.tipo_precio_venta = '2', iif(productos_compuestos.tipo_precio_venta = '3', iif(productos_compuestos.tipo_precio_venta = '4', iif(productos_compuestos.tipo_precio_venta = '7', productos_compuestos.precio_maximo, productos_compuestos.precio_maximo), productos_compuestos.precio_minimo), productos_compuestos.precio_mayor), productos_compuestos.precio_oferta), productos_compuestos.precio_maximo ) * (1 + productos_compuestos.alicuota_iva_compra / 100) ), 2 ) precio_real,
//     (0) precio_real_alt,
//     round((productos_compuestos.precio_oferta * (1 + productos_compuestos.alicuota_iva_compra / 100)), 2 ) precio_oferta,
//     (0) precio_oferta_alt,
//     productos_compuestos.estatus
// from unidades
//     inner join productos_compuestos on (unidades.codigo = productos_compuestos.unidad_secundaria)
//     inner join productos_compuestos_partes on (productos_compuestos.correlativo_partes = productos_compuestos_partes.correlativo_principal)
//     inner join productos_terminados_depositos on (productos_compuestos_partes.parte_producto_codigo = productos_terminados_depositos.producto_codigo)
// group by
//     productos_compuestos.codigo_producto,
//     productos_compuestos.unidad_secundaria,
//     unidades.nombre,
//     productos_compuestos.factor_unidad_secundaria,
//     (iif( productos_compuestos.tipo_precio_venta = '1', iif(productos_compuestos.tipo_precio_venta = '2', iif(productos_compuestos.tipo_precio_venta = '3', iif(productos_compuestos.tipo_precio_venta = '4', iif(productos_compuestos.tipo_precio_venta = '7', productos_compuestos.precio_maximo, productos_compuestos.precio_maximo), productos_compuestos.precio_minimo), productos_compuestos.precio_mayor), productos_compuestos.precio_oferta), productos_compuestos.precio_maximo ) * (1 + productos_compuestos.alicuota_iva_compra / 100) ),
//     (productos_compuestos.precio_oferta * (1 + productos_compuestos.alicuota_iva_compra / 100)), 
//     productos_compuestos.estatus 
// order by 9