import mongoose from 'mongoose'

const productsQuerySchema = new mongoose.Schema({
    PRODUCTO_CODIGO: {
        type: String,
        required: true,
        unique: true
    },
    SUM_OF_EXISTENCIA_ACTUAL: Number,
    UNIDAD_SECUNDARIA: String,
    NOMBRE_UNIDAD_SECUNDARIA: String,
    FACTOR_UNIDAD_SECUNDARIA: Number,
    PRECIO_REAL: Number,
    PRECIO_REAL_ALT: Number,
    PRECIO_OFERTA: Number,
    PRECIO_OFERTA_ALT: Number,
    PRECIO_REAL_SIN_IVA: Number,
    ESTATUS: String,
    DEPARTAMENTO_PADRE:String,
    DEPARTAMENTO_HIJO:String,
    MARCA:String,
    MODELO:String,
    NOMBRE:String,
    DESCRIPCION:String,
    NOMBRE_CORTO:String,
    DOCUMENT_TRIGGER: {
        type: Number,
        required: true
    }
}, { timestamps: true })

const LastProducts = mongoose.model("lastproducts", productsQuerySchema);

export { LastProducts }