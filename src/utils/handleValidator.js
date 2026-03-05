// import { validationResult } from 'express-validator'
// import { Validation } from '../models/validation'
// import colors from 'colors'
// import moment from 'moment'
// const requestIp = require('request-ip')


// const validateResults = async (req, res, next) => {
//     let lines = []
//     let moduleName = "VALIDATION_REQUEST"
//     let message
//     let date
//     let type
//     try {
//         validationResult(req).throw()
//         let request = {
//             type: "SUCCESS",
//             endPoint: req.headers.host + req.originalUrl,
//             params: JSON.stringify(req.body),
//             address: requestIp.getClientIp(req),
//             status: true
//         }
//         let date = moment(new Date()).format('YYYY-MM-DD h:mm:ss a')
//         console.log(colors.magenta(`(${request.type})`) + colors.magenta(` --- ${colors.white(moduleName)} --- `) + colors.yellow(`(${date})`) + `${colors.yellow(" ENDPOINT:")} ${request.endPoint}, ${colors.yellow("ADDRESS:")} ${request.address}, ${colors.yellow("PARAMS:")} ${request.params} `)
//         lines.push(request)
//         return next()
//     }
//     catch (err) {
//         let error = {
//             type: "ERROR",
//             endPoint: req.headers.host + req.originalUrl,
//             details: err.errors,
//             params: JSON.stringify(req.body),
//             address: requestIp.getClientIp(req),
//             status: false
//         }
//         moduleName = "VALIDATION_REQUEST"
//         date = moment(new Date()).format('YYYY-MM-DD h:mm:ss a')
//         console.log(colors.red(`(${error.type})`) + colors.magenta(` --- ${colors.white(moduleName)} --- `) + colors.yellow(`(${date})`) + `${colors.yellow(" ENDPOINT:")} ${error.endPoint}, ${colors.yellow("ADDRESS:")} ${error.address}, ${colors.yellow("DETAILS:")} ${JSON.stringify(error.details)}, ${colors.yellow("PARAMS:")} ${error.params} `)
//         lines.push(error)
//         res.status(400).json({ ERROR: "NOT_VALID" })
//     } finally {
//         await Validation.create(lines[0]).then((response) => {
//             message = `EL REGISTRO DE LOGS DEL MODULO ${colors.magenta(moduleName)} SE HA GUARDADO EN MONGO _id: ${colors.yellow(response._id)}`
//             moduleName = "SYSTEM"
//             type = "LOG"
//             date = moment(new Date()).format('YYYY-MM-DD h:mm:ss a')
//             console.log(colors.blue(`(${type})`) + colors.blue(` --- ${colors.white(moduleName)} --- `) + colors.yellow(`(${date})`) + ` ${message}`)
//         })
//     }
// }

// export { validateResults }