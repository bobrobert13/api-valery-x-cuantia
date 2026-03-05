import mongoose from "mongoose"
let db = process.env.DB_URI

async function mongoConnect() {
    try {
        mongoose.set('strictQuery', true)
        return await mongoose.connect(db, { useNewUrlParser: true }).then((response) => {
            return "MONGO_CONNECTION_SUCCESFULL"
        }).catch((err) => {
            throw err
        })
    } catch (err) {
        throw ["MONGO_CONNECTION_ERROR", err, db]
    }
}




async function mongoDisconnect() {
    mongoose.disconnect()
    return "MONGODB_DETACH_DATABASE"
}

export { mongoConnect, mongoDisconnect }