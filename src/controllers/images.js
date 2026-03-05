import { handleHttpError } from "../utils/handleError"
import { Images } from "../models/image"
const PUBLIC_URL = process.env.PUBLIC_URL
import path from "path"
const MEDIA_PATH = path.join(__dirname, "..", "..", "..", "..", "resources", "banners")
const PUBLIC_PATH = path.join(PUBLIC_URL, "banners")
import fs from "fs"

const getImage = async (req, res) => {
    try {
        const id = req.params.id
        const data = await Images.findById(id)
        req.Logger.complete()
        res.send({ data })
    }
    catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
            return
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
    } finally {
        await req.Logger.save()
    }
}

const getImages = async (req, res) => {
    try {
        const data = await Images.find({})
        req.Logger.complete()
        res.send({ data })
    }
    catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
            return
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
    } finally {
        await req.Logger.save()
    }
}

const createImage = async (req, res) => {
    try {
        console.log(path.join(PUBLIC_URL))
        const { file } = req
        const fileData = {
            filename: file.filename,
            url: (path.join(PUBLIC_PATH, file.filename)).replace(/\\/g, "\\\\")
        }
        const data = await Images.create(fileData)
        req.Logger.complete()
        res.send({ data })
    }
    catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
            return
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
    } finally {
        await req.Logger.save()
    }
}

const updateImage = async (req, res) => {
    try {
        const id = req.params.id
        const dataFile = await Images.findById(id)
        const { filename } = dataFile
        const { file } = req
        const fileData = {
            filename: file.filename,
            _id: id,
            url: (path.join(PUBLIC_PATH, file.filename)).replace(/\\/g, "\\\\")
        }
        dataFile.url = fileData.url
        dataFile.filename = fileData.filename
        await dataFile.save()
        const filePath = path.join(MEDIA_PATH, filename)
        fs.unlinkSync(filePath)
        req.Logger.complete()
        res.send({ fileData })
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

const deleteImage = async (req, res) => {
    try {
        const id = req.params.id
        const dataFile = await Images.findById(id)
        await Images.deleteOne({ _id: id })
        const { filename } = dataFile
        const filePath = path.join(MEDIA_PATH, filename)
        fs.unlinkSync(filePath)
        const data = {
            filePath,
            delete: true
        }
        req.Logger.complete()
        res.send({ data })
    }
    catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
            return
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
    } finally {
        await req.Logger.save()
    }
}

export { createImage, deleteImage, getImages, updateImage, getImage }