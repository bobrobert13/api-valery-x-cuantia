import { Router } from 'express'
import { logger } from '../middlewares/system.js'
import { authenticator, roleChecker } from '../middlewares/authentication'
import { loginUser, registerUser } from '../controllers/auth.js'

const router = Router()

router.post("/register", logger, authenticator, roleChecker(['superAdmin']), registerUser)

router.post("/login", logger, loginUser)

module.exports = router