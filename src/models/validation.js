import mongoose from 'mongoose'

const errorValidationSchema = new mongoose.Schema({
    value: String,
    msg: String,
    param: String,
    localtion: String
}, { timestamps: false })

const requestValidationSchema = new mongoose.Schema({
    type: String,
    endPoint: String,
    details: [errorValidationSchema],
    params: String,
    address: String,
    status: Boolean

}, { timestamps: true })

const Validation = mongoose.model("validation", requestValidationSchema)

export { Validation }