import mongoose from 'mongoose'
import { Audit } from './audit';
const statuses = ["PENDIENTE", "COMPLETADA"]

const inventorySchema = new mongoose.Schema({
    auditId: String,
    CODIGO_PRODUCTO: String,
    NOMBRE_PRODUCTO: String,
    DEPARTAMENTO_PADRE: String,
    DEPARTAMENTO_HIJO: String,
    ESTATUS: String,
    EXISTENCIA_DETAL: Number,
    EXISTENCIA_MAYOR: Number,
    EXISTENCIA_TOTAL: Number,
    CONTEO: {
        type: Number,
        default: 0
    },
    DIFERENCIA: {
        type: Number,
        default: 0
    },
    SENSITIVE: {
        type: Boolean,
        default: false
    },
    STATUS: {
        type: statuses,
        default: statuses[0]
    },
    USER: {
        type: String,
        default: ""
    },
    COMMENT: {
        type: String,
        default: ""
    }
}, { timestamps: true })

inventorySchema.pre('validate', async function (next) {
    this.auditId = !!this.SENSITIVE ?
        (await Audit.find({ sensitive: true }).sort({ _id: -1 }).limit(1).lean())[0].auditId :
        (await Audit.find({ sensitive: false }).sort({ _id: -1 }).limit(1).lean())[0].auditId
    next();
});


inventorySchema.pre('save', async function (next) {
    this.STATUS = statuses[1]
    next();
});


const Inventory = mongoose.model("inventory", inventorySchema);

export { Inventory }