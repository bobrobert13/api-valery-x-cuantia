import { REQUEST } from "../functions/logger"
const requestIp = require('request-ip')

const logger = async (req, res, next) => {
    const address = requestIp.getClientIp(req)
    const endPoint = req.headers.host + req.originalUrl
    const Logger = new REQUEST("REQUEST", endPoint, address)
    req.Logger = Logger
    req.Logger.log(`NUEVA PETICIÓN ENTRANTE DESDE ${address} AL ENDPOINT ${endPoint}`)
    next()
}

export { logger }