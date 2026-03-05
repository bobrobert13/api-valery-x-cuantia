import { FDB } from "../config/databases/firebird";
import { handleHttpError } from "../utils/handleError";
import { createImageProduct } from "../utils/handleImages";
import { Data } from "../models/data";
const PUBLIC_URL = process.env.PUBLIC_URL
import path from "path"
const Firebird = new FDB();

const getProductData = async (req, res) => {
  try {
    await Firebird.connect();
    let product = await Firebird.query(`
      select 
        productos_terminados.nombre nombre_producto,
        productos_terminados.codigo_producto,
        productos_terminados.marca,
        cast((round((productos_terminados.alicuota_iva_compra))) as varchar(2)) iva_porcentaje,
        cast((round(((round((((iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo, productos_terminados.precio_maximo), productos_terminados.precio_minimo), productos_terminados.precio_mayor), productos_terminados.precio_oferta), productos_terminados.precio_maximo ) * (1 + productos_terminados.alicuota_iva_compra / 100) ) * (select moneda.factor_cambio from moneda where moneda.codigo = '02'))), 2)) - (round(((iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo, productos_terminados.precio_maximo), productos_terminados.precio_minimo), productos_terminados.precio_mayor), productos_terminados.precio_oferta), productos_terminados.precio_maximo  ) * (select moneda.factor_cambio from moneda where moneda.codigo = '02'))), 2))), 2)) as varchar(5)) iva,
        cast((round((iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo, productos_terminados.precio_maximo), productos_terminados.precio_minimo), productos_terminados.precio_mayor), productos_terminados.precio_oferta), productos_terminados.precio_maximo ) * (select moneda.factor_cambio from moneda where moneda.codigo = '02')), 2 )) as varchar(15)) precio_sin_iva,
        cast((round(((iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo, productos_terminados.precio_maximo), productos_terminados.precio_minimo), productos_terminados.precio_mayor), productos_terminados.precio_oferta), productos_terminados.precio_maximo ) * (1 + productos_terminados.alicuota_iva_compra / 100))), 2 )) as varchar(15)) precio_con_iva,
        cast((round((((iif( productos_terminados.tipo_precio_venta = '1', iif(productos_terminados.tipo_precio_venta = '2', iif(productos_terminados.tipo_precio_venta = '3', iif(productos_terminados.tipo_precio_venta = '4', iif(productos_terminados.tipo_precio_venta = '7', productos_terminados.precio_maximo, productos_terminados.precio_maximo), productos_terminados.precio_minimo), productos_terminados.precio_mayor), productos_terminados.precio_oferta), productos_terminados.precio_maximo ) * (1 + productos_terminados.alicuota_iva_compra / 100) ) * (select moneda.factor_cambio from moneda where moneda.codigo = '02'))), 2)) as varchar(15)) precio_con_iva_al_cambio,
        (select moneda.nombre from moneda where moneda.codigo = '02') nombre_moneda,
        cast((round((select moneda.factor_cambio from moneda where moneda.codigo = '02'), 2 )) as varchar(15)) factor_cambio,
        cast(extract( year from (select moneda.ultima_actualizacion_tasa from moneda where moneda.codigo = '02')) || '-' || lpad((cast((extract( month from (select moneda.ultima_actualizacion_tasa from moneda where moneda.codigo = '02'))) as varchar(2))), 2, '0') || '-' || lpad((cast((extract( day from (select moneda.ultima_actualizacion_tasa from moneda where moneda.codigo = '02'))) as varchar(2))), 2, '0') as varchar(10)) fecha_tasa,
        productos_terminados_foto.imagen
      from productos_terminados 
        left join productos_terminados_foto on (productos_terminados.codigo_producto = productos_terminados_foto.producto_codigo and productos_terminados_foto.tipo = 'PV') 
        inner join moneda on (productos_terminados.moneda_codigo = moneda.codigo) where productos_terminados.codigo_producto = '${req.body.result}'`
    )

    if (!product.length) {
      throw ["NO_PRODUCT_MATCH", JSON.stringify(req.body.result)]
    }

    let image = (path.join(PUBLIC_URL, "products", "default.png")).replace(/\\/g, "\\\\")

    if (product[0].IMAGEN) {
      const buffer = await Firebird.buffer(product[0].IMAGEN);
      image = await createImageProduct(buffer, req.body.result);
    }

    product[0]["IMAGEN"] = image

    req.Logger.complete();
    res.status(200).json({
      result: true,
      product: product,
    });
  } catch (err) {
    if (Array.isArray(err)) {
      handleHttpError(req, res, err[0], 400, err[1]);
      return;
    }
    handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
  } finally {
    await Firebird.detach();
    await req.Logger.save();
  }
};

const getDirection = async (req, res) => {
  try {
    const localData = await Data.findOne({})
    const direction = localData.visor.direction
    if (direction) {
      req.Logger.complete()
      res.status(200).json({ direction, image: (path.join(PUBLIC_URL, "visor", `${direction}.png`)).replace(/\\/g, "\\\\") })
      return
    }

    throw ["DIRECTION_NOT_FOUND", JSON.stringify(direction)]

  } catch (err) {
    if (Array.isArray(err)) {
      handleHttpError(req, res, err[0], 400, err[1]);
      return;
    }
    handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
  } finally {
    await req.Logger.save();
  }
};

const changeDirection = async (req, res) => {
  try {
    const { direction } = req.body

    const update = await Data.updateOne({}, {
      $set: {
        "visor.direction": direction
      }
    })

    if (update.modifiedCount) {
      req.Logger.complete()
      res.status(200).json({ status: true })
      return
    }

    throw ["DIRECTION_NOT_UPDATED", JSON.stringify(update)]
  } catch (err) {
    if (Array.isArray(err)) {
      handleHttpError(req, res, err[0], 400, err[1]);
      return;
    }
    handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
  } finally {
    await req.Logger.save();
  }
};

export { getProductData, getDirection, changeDirection };
