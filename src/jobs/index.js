import { Configs } from "../models/configs"
import cron from "cron"
import actPrecios from "./actPrecios"
import cuantiaLogin from "./cuantiaLogin"
import actQrs from "./actQrs"
import importProducts from "./importProducts"
import audits from "./audits"
import backups from "./backups"
import opening from "./opening"
import closing from "./closing"
import actTasas from "./actTasas"
import crtImgs from "./crtImgs"


let jobs = [
    actPrecios,
    cuantiaLogin,
    actQrs,
    importProducts,
    audits,
    backups,
    opening,
    closing,
    actTasas,
    crtImgs
]

let running = {}
const initJobs = async () => {
    for (const job of jobs) {
        const config = await Configs.findOne({ nameJob: job.name }).lean()
        const task = new cron.CronJob(
            await job.time(),
            job.task,
            null,
            false,
            undefined,
            undefined,
            ["opening", "closing"].indexOf(job.name) >= 0 ? false : config.isActive ? true : false
        )

        if (config.isActive) {
            task.start()
        }

        running[job.name] = task
    }
}


export { running, initJobs }