import { Router } from "express"
import { getProductData, getDirection, changeDirection } from "../controllers/firebird";
import { authenticator, roleChecker } from '../middlewares/authentication'
import { logger } from '../middlewares/system.js'
const router = Router()

router.post("/getProductData", logger, authenticator, roleChecker(['admin', 'superAdmin', 'visor']), getProductData)

router.get("/getDirection", logger, authenticator, roleChecker(['admin', 'superAdmin', 'visor']), getDirection)

router.post("/changeDirection", logger, authenticator, roleChecker(['admin', 'superAdmin']), changeDirection)



module.exports = router