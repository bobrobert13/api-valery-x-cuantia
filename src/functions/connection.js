import { FDB } from '../config/databases/firebird.js'
import { mongoConnect } from '../config/databases/mongo.js'
const Firebird = new FDB()

const connectionsInit = async (Logger) => {
    try {
        Logger.log(await Firebird.start(200))
        Logger.log(await Firebird.connect())
        Logger.log(await Firebird.detach())
        Logger.log(await mongoConnect())
    } catch (err) {
        throw err
    }
}

export { connectionsInit }