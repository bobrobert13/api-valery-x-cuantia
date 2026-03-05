import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    CODIGO_PRODUCTO: String,
    NOMBRE_PRODUCTO: String,
    DEPARTAMENTO_PADRE: String,
    DEPARTAMENTO_HIJO: String,
    ESTATUS: String,
    EXISTENCIA_DETAL: Number,
    EXISTENCIA_MAYOR: Number,
    EXISTENCIA_TOTAL: Number,
    SENSITIVE: {
        type: Boolean,
        default : false
    }
}, { timestamps: true })

const Products = mongoose.model("products", productSchema);

export { Products }