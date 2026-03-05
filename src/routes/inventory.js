import { Router } from "express";
import {
    getProduct,
    getProducts,
    setSensitives,
    startSensitiveAudit,
    updateInventory,
    statusAudit,
    auditClosure,
    getInventory,
    getAudits,
    getAuditDetails,
    getCategories,
    registerInventory,
    generateExcel
} from "../controllers/inventory";
import { authenticator, roleChecker } from '../middlewares/authentication'
import { logger } from '../middlewares/system.js'
const router = Router();

router.post("/getProducts", logger, authenticator, roleChecker(['admin', 'superAdmin', 'user']), getProducts)

router.post("/getProduct", logger, authenticator, roleChecker(['admin', 'superAdmin', 'user']), getProduct)

router.get("/getCategories", logger, authenticator, roleChecker(['admin', 'superAdmin']), getCategories)

router.post("/setSensitives", logger, authenticator, roleChecker(['admin', 'superAdmin']), setSensitives)

router.post("/getInventory", logger, authenticator, roleChecker(['admin', 'user', 'superAdmin']), getInventory)

router.post("/startAuditSensitives", logger, authenticator, roleChecker(['admin', 'superAdmin']), startSensitiveAudit)

router.post("/updateInventory", logger, authenticator, roleChecker(['admin', 'user', 'superAdmin']), updateInventory)

router.post("/registerInventory", logger, authenticator, roleChecker(['admin', 'user', 'superAdmin']), registerInventory)

router.post("/statusAudit", logger, authenticator, roleChecker(['admin', 'user', 'superAdmin']), statusAudit)

router.post("/auditClosure", logger, authenticator, roleChecker(['admin', 'superAdmin']), auditClosure)

router.post("/getAudits", logger, authenticator, roleChecker(['admin', 'superAdmin']), getAudits)

router.post("/getAuditDetails", logger, authenticator, roleChecker(['admin', 'superAdmin']), getAuditDetails)

router.post("/generateExcel", logger, authenticator, roleChecker(['admin', 'superAdmin']), generateExcel)

module.exports = router
