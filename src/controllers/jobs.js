import { Configs } from "../models/configs"
import { Jobs } from "../models/jobs"
import { handleHttpError } from "../utils/handleError"
import { running } from "../jobs"
import { CronTime } from "cron"
import { ssqlProducts } from "../resources/queries/actPrecios"
import { runSQLPython } from "../utils/callPythonScript"
const allProductsValery = async (req, res)=>{
    try{
        runSQLPython(ssqlProducts).then((data)=>{
            res.status(200).json({products:data})
        }).catch((err)=>{
            res.status(400).json({error:err})
        })
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
            return
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
    } finally {
        await req.Logger.save()
    }
}

const triggerTask = async (req, res) => {
    try {
        const task = require(`../tasks/${req.params.taskName}.js`)
        task.default(req.body)
            .then(() => {
                res.status(200).json({ success: true })
            }).catch((error) => {
                res.status(400).json({ error: error })
            })

    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
            return
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
    } finally {
        await req.Logger.save()
    }
}

const triggerJob = async (req, res) => {
    try {
        const job = require(`../jobs/${req.params.jobName}.js`)
        job.default.task()
            .then(() => {
                res.status(200).json({ success: true })
            }).catch((error) => {
                throw error
            })

    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
            return
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
    } finally {
        await req.Logger.save()
    }
}

const getJobs = async (req, res) => {
    try {
        const jobs = await Configs.find({ nameJob: { $ne: "insertPrs" } }).lean()
        req.Logger.complete()
        res.status(200).json(jobs)
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
            return
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
    } finally {
        await req.Logger.save()
    }
}

const getJob = async (req, res) => {
    try {
        const name = req.params.jobName
        const job = await Configs.findOne({ nameJob: name }).lean()
        req.Logger.complete()
        res.status(200).json(job)
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
            return
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
    } finally {
        await req.Logger.save()
    }
}

const configureJobs = async (req, res) => {
    try {
        let jobs = req.body.jobs
        for (const job of jobs) {
            const config = await Configs.findOne({ nameJob: job.nameJob })
            if (job.isActive != config.isActive) {
                config.isActive = job.isActive
                if (config.isActive) {
                    running[job.nameJob].start()
                } else {
                    running[job.nameJob].stop()
                }
            }

            if (job.cronExpression != config.cronExpression) {
                config.cronExpression = job.cronExpression
                if (config.isActive) running[job.nameJob].setTime(new CronTime(job.cronExpression))
            }
            config.isPeriodic = job.isPeriodic
            config.timeStep = job.timeStep
            config.timeAmmount = job.timeAmmount
            config.dayOfWeek = job.dayOfWeek
            config.hourOfDay = job.hourOfDay
            await config.save()
        }
        req.Logger.complete()
        res.status(200).json("success")
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
            return
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
    } finally {
        await req.Logger.save()
    }
}


const getAllLogs = async (req, res) => {
    let name = req.body.name
    let from = req.body.from
    let to = req.body.to
    let desde = from.replace(/[/]/g, "-")
    let hasta = to.replace(/[/]/g, "-")
    let type = req.body.type
    let limit = req.body.limit ? req.body.limit : 10
    let skip = req.body.skip ? req.body.skip : 0
    try {
        let query = {}
        if (name && name != "Todos") query.module = name
        if (from && to) query.$and = [
            { createdAt: { $gte: new Date(desde + "T00:00:00.000-04:00") } },
            { createdAt: { $lte: new Date(hasta + "T23:59:59.000-04:00") } }
        ]
        if (type && type != "Todos") query.status = type == "Completado"
        const logs = await Jobs.aggregate([
            { $match: query },
            { $unwind: { path: '$lines' } },
            {
                $group: {
                    _id: {
                        _id: '$_id',
                        module: '$module',
                        status: '$status',
                        createdAt: '$createdAt'
                    },
                    lines: {
                        $count: {}
                    }
                }
            },
            {
                $project: {
                    _id: '$_id._id',
                    module: '$_id.module',
                    status: '$_id.status',
                    createdAt: '$_id.createdAt',
                    lines: '$lines'
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            { $skip: skip },
            { $limit: limit }
        ])
        req.Logger.complete()
        res.status(200).json(logs)
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
            return
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
    } finally {
        await req.Logger.save()
    }
}

const getSingleLog = async (req, res) => {
    let logId = req.params.logId
    try {
        const log = await Jobs.findById(logId).lean()
        req.Logger.complete()
        res.status(200).json(log)
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
            return
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
    } finally {
        await req.Logger.save()
    }
}


// const setTime = async (name, time) => {
//     await Configs.updateOne({ nameJob: name }, { $set: { cronExpression: time } })
//     for (const job in running) {
//         if (job == name) {
//             running[job].setTime(new CronTime(time))
//         }
//     }
//     return true
// }

// const toggle = async (name) => {
//     const config = await Configs.findOne({ nameJob: name })
//     config.isActive = !config.isActive;
//     await config.save()
//     for (const job in running) {
//         if (job == name) {
//             if (config.isActive) {
//                 running[job].start()
//             } else {
//                 running[job].stop()
//             }

//         }
//     }
//     return config.isActive
// }
export { getJob, getJobs, configureJobs, getAllLogs, getSingleLog, triggerJob, triggerTask,allProductsValery }