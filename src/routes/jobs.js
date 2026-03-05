import { Router } from "express";
import { getJobs, configureJobs, getAllLogs, getSingleLog, triggerJob, triggerTask , allProductsValery} from "../controllers/jobs";
import { authenticator, roleChecker } from '../middlewares/authentication'
import { logger } from '../middlewares/system.js'

const router = Router()

router.get("/", logger, authenticator, roleChecker(['admin', 'superAdmin']), getJobs)

router.post("/logs", logger, authenticator, roleChecker(['admin', 'superAdmin']), getAllLogs)

router.get("/logs/:logId", logger, authenticator, roleChecker(['admin', 'superAdmin']), getSingleLog)

router.put("/configure", logger, authenticator, roleChecker(['admin', 'superAdmin']), configureJobs)

router.post("/trigger/:jobName", logger, authenticator, roleChecker(['admin', 'superAdmin']), triggerJob)

router.post("/task/:taskName", logger, authenticator, roleChecker(['admin', 'superAdmin']), triggerTask)

router.get("/allProductsValery", logger, authenticator, roleChecker(['admin', 'superAdmin']), allProductsValery)

module.exports = router



