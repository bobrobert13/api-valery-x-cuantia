import mongoose from "mongoose";

const historialTasaBCVSchema = new mongoose.Schema({
    ID:{
        type:String,
        index:true,
        unique:true
    },
    ANO:Number,
    MES:Number,
    DIA:Number,
    MONEDA_CODIGO:String,
    PROMEDIODEFACTOR_CAMBIO:Number,
    NOMBRE:String
})

export const historialTasaBCV = mongoose.model("historialTasaBCV", historialTasaBCVSchema)

// const histMonedaBCVSchema = new mongoose.Schema({
//     FECHA:{
//         type:Number,
//         index:true,
//         unique:true,
//     },
//     ANO:Number,
//     MES:Number,
//     DAY:Number,
//     MONEDA_CODIGO:String,
//     TASA:Number,
//     NOMBRE:String
// })

// export const historialMonedaBCV = mongoose.model("historialMonedaBCV", histMonedaBCVSchema)

const histCostoInventarioSchema = new mongoose.Schema({
    ID:{
        type:String,
        require:true,
        index:true,
        unique:true,
    },
    DEP_PADRE: String,
    DEP_HIJO: String,
    REF: String,
    NOMBRE_PROD: String,
    COSTO_UND: Number,
    CANTIDAD: Number,
    COSTO_TOTAL: Number,
    ULTIMA_FACTURA_COMPRA: Date,
    FECHA:Date,
    MONEDA: String,
    ANO: Number,
    MES: Number,
    DIA: Number
})

export const historialCostoInventario = mongoose.model("historialCostoInventario", histCostoInventarioSchema)