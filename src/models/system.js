import mongoose from 'mongoose'

const lineTypes = ["LOG", "WARNING", "ERROR"]

const lineSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: lineTypes
    },
    date: Date,
    message: String,
    error: String,
    params: String
}, { timestamps: false })

const logSchema = new mongoose.Schema({
    type: String,
    module: String,
    lines: [lineSchema],
    status: Boolean

}, { timestamps: true })

const System = mongoose.model("system", logSchema)

export { System }