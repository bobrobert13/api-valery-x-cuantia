import { FDB } from "../config/databases/firebird";
import { Configs } from "../models/configs";
import { Data } from "../models/data";
import { JOB } from "../functions/logger";

import { runSQLPython } from "../utils/callPythonScript";

import {updateHistorialTasaBCV, updateHistorialCostoInventario, getHistoriaCostoInventario} from "../functions/statistics"

import {
  historialTasaBCVSQL,
  constoInventarioXProducto
} from "../resources/queries/statistics";

import {  historialTasaBCV, historialCostoInventario } from "../models/statistics";

let isRunning = false;
const Firebird = new FDB();


function getDate(date){
  const year = date.getFullYear()
  const month = date.getMonth() +1
  const day = date.getDate()
  return {
    year,
    month,
    day,
    date :`${year}-${month<10? "0"+month : month}-${day<10?"0"+day:day}`
  }
}
function makeDate(dateobj){
  return new Date(`${dateobj.ANO}-${dateobj.MES<10? "0"+dateobj.MES : dateobj.MES}-${dateobj.DIA<10?"0"+dateobj.DIA:dateobj.DIA}T12:00:00`)
}

async function task() {
  const Logger = new JOB("statistics");
  try {
    if (!isRunning) {
      isRunning = true;
      Logger.log(`INICIANDO JOB DE ESTADISTICAS`);
      await Firebird.connect();
      Logger.log(`CONEXION A FIREBIRD EXITOSA`);

      const localData = await Data.findOne({}).lean()
      const beforeUpdate = await historialTasaBCV.aggregate([
        {
            $project:{
                ANO:1,
                MES:1,
                DIA:1,
                TASA:"$PROMEDIODEFACTOR_CAMBIO"
            },
        },
        {
            $sort:{
                ANO:-1,
                MES:-1,
                DIA:-1
            }
        },
        {$limit:1}
    ])
      
      const {date:lastDate} = beforeUpdate[0]? getDate(makeDate(beforeUpdate[0])) : {date:null}
      const histTasa3 = await Firebird.query(historialTasaBCVSQL(lastDate));
      for (const tasa of histTasa3) {
        await historialTasaBCV.updateOne(
          { ID: tasa.ID },
          { $set: { 
            ...tasa,
            PROMEDIODEFACTOR_CAMBIO: tasa.PROMEDIODEFACTOR_CAMBIO? Math.round((tasa.PROMEDIODEFACTOR_CAMBIO + Number.EPSILON) * 100) / 100 : null
            
           } },
          { upsert: true }
        );
      }

    const missingDays = await historialTasaBCV.aggregate([
        {
            $project:{
                ANO:1,
                MES:1,
                DIA:1,
                TASA:"$PROMEDIODEFACTOR_CAMBIO"
            },
        },
        {
            $sort:{
                ANO:1,
                MES:1,
                DIA:1
            }
        }
    ])


    const earliest = missingDays[0]

    const earlyDate = makeDate(earliest)

    const latest = missingDays[missingDays.length-1]

    const lateDate = makeDate(latest)

    let currentDate = makeDate(earliest)
    let prevTasa = earliest.TASA
    let days = 0
    while (currentDate.valueOf()!= lateDate.valueOf()){

      const {year, month, day, date} = getDate(currentDate)
      // console.log("dafuq", currentDate, year,month, day)

      const fecha  = await historialTasaBCV.findOne({ANO:year, MES:month, DIA:day}).lean()
      // console.log(`day: ${++days}, ${fecha ? null : date}: ${fecha? fecha.PROMEDIODEFACTOR_CAMBIO : null}`)
      if (fecha){ //Date exists
        if (fecha.PROMEDIODEFACTOR_CAMBIO){
          prevTasa = fecha.PROMEDIODEFACTOR_CAMBIO
        }else{
          Logger.log(`ACTUALIZANDO TAZA DEL DIA ${fecha.ID} (${fecha.PROMEDIODEFACTOR_CAMBIO}) A: ${prevTasa}` )
          await historialTasaBCV.findOneAndUpdate(fecha._id, {$set:{PROMEDIODEFACTOR_CAMBIO:prevTasa}})
        }

      }else{ // Date doesnt exists, create with previous tasa
        Logger.log(`CREADA TASA PARA ${currentDate} EN ${prevTasa}`)
        await historialTasaBCV.create({ANO:year, MES:month, DIA:day, ID:`${year}-${month}-${day}`, PROMEDIODEFACTOR_CAMBIO:prevTasa, NOMBRE:"BCV", MONEDA_CODIGO:"02" })
      }

      currentDate.setDate(currentDate.getDate()+1)
    }

    // const tasasEnCuantia= await getHistorialTasaBCV(localData.token)
    
    const historialTasa = await historialTasaBCV.find({ 
      // ID:{$nin:tasasEnCuantia}, 
      PROMEDIODEFACTOR_CAMBIO:{$ne:null}
    }, {_id:0, __v:0}).lean()

    await updateHistorialTasaBCV(historialTasa,localData.token)
    //costo de inventario por producto
    const productos_existencia = await Firebird.query(constoInventarioXProducto())
    for (const productoExistencia of productos_existencia) {
      await historialCostoInventario.updateOne(
        { ID: `${productoExistencia.REF}:${productoExistencia.ANO}-${productoExistencia.MES}-${productoExistencia.DIA}` },
        { $set: { 
          ...productoExistencia,
          COSTO_TOTAL:Math.round((productoExistencia.COSTO_TOTAL + Number.EPSILON) * 100) / 100,
          COSTO_UND:Math.round((productoExistencia.COSTO_UND + Number.EPSILON) * 100) / 100
        } },
        { upsert: true }
      );
    }

    const historialCosto = await historialCostoInventario.aggregate([
                  
        {
            $sort:{
                FECHA:1
            }
        }
    ])
    const early = historialCosto[0]
    const late = historialCosto[historialCosto.length-1]
    const invMissingCuantia = await getHistoriaCostoInventario(makeDate(early), makeDate(late), localData.token)
    let invsToPush = []
    for (const invMissing of invMissingCuantia){
      Logger.log(`Se actualizara el inventario del dia ${JSON.stringify(invMissing)}`)
      const costoInventario = await historialCostoInventario.find({...invMissing}, {_id:0, __v:0}).lean()
      invsToPush = costoInventario.concat(invsToPush)
    }
    await updateHistorialCostoInventario(invsToPush, localData.token)

      Logger.log("EL JOB DE ESTADISTICIAS SE HA COMPLETADO");
      Logger.complete();
      isRunning = false;
      return;
    }
    Logger.warn(
      "EL JOB DE ESTADISTICAS AUN ESTA CORRIENDO, SE HA DENEGADO LA OPERACIÓN"
    );
  } catch (err) {
    isRunning = false;
    Logger.warn("EL JOB DE ESTADISTICAS HA FALLADO");
    let message;
    let error;
    let params;
    if (Array.isArray(err)) {
      message = err[0];
      error = err[1];
      params = err[2];
      Logger.error(message, error, params);
      return;
    }
    message = "UNKNOW_ERROR";
    error = err;
    params = "UNKNOW_PARAMS";
    Logger.error(message, error, params);
  } finally {
    await Firebird.detach();
    await Logger.save();
  }
}

async function time() {
  let configs = await Configs.findOne({ nameJob: "statistics" });

  return configs.cronExpression;
}

export default { task, time, name: "statistics" };
