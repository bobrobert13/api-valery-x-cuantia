import mongoose from 'mongoose'

const configsSchema = new mongoose.Schema({
    nameJob: String,
    displayName: String,
    isPeriodic: {
        type: Boolean,
        default: true
    },
    timeStep: {
        type: String,
        default: "Segundos"
    },
    timeAmmount: {
        type: Number,
        default: 1
    },
    dayOfWeek: {
        type:[String],
        default:["Domingo"]
    },
    hourOfDay:{
        type:[Number],
        default:[0]
    },
    cronExpression: String,
    isActive: {
        type: Boolean,
        default: false
    },

}, { timestamps: true })

const Configs = mongoose.model("configs", configsSchema)

export { Configs }