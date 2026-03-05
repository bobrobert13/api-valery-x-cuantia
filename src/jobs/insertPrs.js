// import { Configs } from "../models/configs"
// import { getOrders } from "../functions/insertPrs"
// import { processOrdersData } from "../functions/insertPrs"
// import mongoose, { get } from "mongoose"
// import { Data } from "../models/data"
// import { FDB } from "../config/databases/firebird"
// import moment from 'moment'
// import colors from 'colors'
// import { Logs } from "../models/logs"
// let Firebird = new FDB()

// async function task() {
//     let isRunning = false
//     let lines = []
//     let moduleName = "insertPrs"
//     let date
//     let message
//     let error
//     let params
//     let type
//     let status = false
//     const localData = await Data.findOne({}).lean()
//     let logDate
//     try {
//         if (!isRunning) {
//             isRunning = true
//             let orders = await getOrders(localData.token)
//             let ordersData = await processOrdersData(orders)
//             console.log(ordersData[0][1])
//         } else {
//             type = "WARNING"
//             console.log(colors.yellow(`(${type})`) + colors.blue(` --- ${colors.white(moduleName)} --- `) + colors.yellow(`(${moment(new Date()).format('YYYY-MM-DD h:mm:ss a')})`) + " EL JOB DE INSERSION DE PRESUPUESTOS AUN ESTA CORRIENDO, SE HA DENEGADO LA OPERACIÓN")
//         }
//     } catch (err) {
//         if (Array.isArray(err) == true) {
//             if (err[3]) {
//                 let newLines = lines.concat(err[3])
//                 lines = newLines
//             }
//             type = "WARNING"
//             message = "EL JOB DE INYECCIÓN DE PRESUPUESTOS AH FALLADO"
//             date = moment(new Date()).format('YYYY-MM-DD h:mm:ss a')
//             logDate = new Date()
//             console.log(colors.yellow(`(${type})`) + colors.blue(` --- ${colors.white(moduleName)} --- `) + colors.yellow(`(${date})`) + ` ${message}`)
//             lines.push({ type, message, date: logDate })
//             type = "ERROR"
//             message = err[0]
//             error = err[1]
//             params = err[2]
//             date = moment(new Date()).format('YYYY-MM-DD h:mm:ss a')
//             logDate = new Date()
//             console.log(colors.red(`(${type})`) + colors.blue(` --- ${colors.white(moduleName)} --- `) + colors.yellow(`(${date})`) + colors.red(" NAME: ") + message + colors.red(" ERROR: ") + error + colors.red(" PARAMS: ") + params)
//             lines.push({ type, message, date: logDate, error, params })
//         } else {
//             type = "WARNING"
//             message = "EL JOB DE INYECCIÓN DE PRESUPUESTOS AH FALLADO"
//             date = moment(new Date()).format('YYYY-MM-DD h:mm:ss a')
//             logDate = new Date()
//             console.log(colors.yellow(`(${type})`) + colors.blue(` --- ${colors.white(moduleName)} --- `) + colors.yellow(`(${date})`) + ` ${message}`)
//             lines.push({ type, message, date: logDate })
//             type = "ERROR"
//             message = "UNKNOW_ERROR"
//             error = err
//             params = "UNKNOW_PARAMS"
//             date = moment(new Date()).format('YYYY-MM-DD h:mm:ss a')
//             logDate = new Date()
//             console.log(colors.red(`(${type})`) + colors.blue(` --- ${colors.white(moduleName)} --- `) + colors.yellow(`(${date})`) + colors.red(" NAME: ") + message + colors.red(" ERROR: ") + error + colors.red(" PARAMS: ") + params)
//             lines.push({ type, message, date: logDate, error, params })
//         }
//     } finally {
//         let logs = {
//             type: "JOB",
//             module: moduleName,
//             lines: lines,
//             status: status
//         }
//         await Logs.create(logs).then((response) => {
//             type = "LOG"
//             message = `EL REGISTRO DE LOGS DEL MODULO ${colors.magenta(moduleName)} SE HA GUARDADO EN MONGO _id: ${colors.yellow(response._id)}`
//             moduleName = "SYSTEM"
//             date = moment(new Date()).format('YYYY-MM-DD h:mm:ss a')
//             logDate = new Date()
//             console.log(colors.blue(`(${type})`) + colors.blue(` --- ${colors.white(moduleName)} --- `) + colors.yellow(`(${date})`) + ` ${message}`)
//         })
//         Firebird.detach()
//         isRunning = false
//     }

// }

// async function time() {
//     let configs = await Configs.findOne({ nameJob: "insertPrs" })
//     return configs.cronExpression
// }

// export default { task, time, name: "actQrs" }