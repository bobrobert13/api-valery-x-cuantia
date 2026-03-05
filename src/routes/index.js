import express from 'express'
import fs from 'fs'

const router = express.Router()

const PATH_ROUTES = __dirname

const removeExtension = (fileName) => {
    return fileName.split('.').shift()
}

fs.readdirSync(PATH_ROUTES).filter((file) => {
    const route = removeExtension(file)
    if (route !== 'index') {
        router.use(`/${route}`, require(`./${file}`))
    }
})

module.exports = router