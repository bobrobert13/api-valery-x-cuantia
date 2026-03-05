import mongoose from 'mongoose'
const directions = ["up", "down", "left", "right"]
const dataSchema = new mongoose.Schema({
    token: String,
    correlative: Number,
    credentials: {
        email: {
            type: String,
            unique: true
        },
        password: String
    },
    visor: {
        direction: {
            type: directions,
            default: directions[1]
        }
    }
}, { timestamps: true })

const Data = mongoose.model("data", dataSchema)

export { Data }