import { Router } from "express";
import { uploadFile, validatorFile } from "../middlewares/files";
import { getImage, getImages, createImage, deleteImage, updateImage } from "../controllers/images";
import { authenticator, roleChecker } from '../middlewares/authentication'
import { logger } from '../middlewares/system.js'
const router = Router()

router.get("/getImage/:id", logger, authenticator, roleChecker(['admin', 'superAdmin']), getImage)

router.get("/getImages", authenticator, roleChecker(['admin', 'superAdmin', 'visor']), logger, getImages)

router.post("/createImage", logger, authenticator, roleChecker(['admin', 'superAdmin']), uploadFile.single("myfile"), validatorFile, createImage)

router.delete("/deleteImage/:id", logger, authenticator, roleChecker(['admin', 'superAdmin']), deleteImage)

router.put("/updateImage/:id", logger, authenticator, roleChecker(['admin', 'superAdmin']), uploadFile.single("myfile"), validatorFile, updateImage)

module.exports = router