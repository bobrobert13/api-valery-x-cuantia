import fs from "fs"
import path from "path"
const PUBLIC_URL = process.env.PUBLIC_URL
const MEDIA_PATH = path.join(__dirname, "..", "..", "..", "..", "resources", "excels")
const PUBLIC_PATH = path.join(PUBLIC_URL, "excels")


const calculatePages = (total, limit) => {
    return Math.trunc(total / limit) + (total % limit == 0 ? 0 : 1)
}

const calculateLenghtRows = (products) => {
    let acc = {}

    let lengths = []

    for (const product of products) {
        const accKeys = Object.keys(acc)
        const productKeys = Object.keys(product)

        if (!accKeys.length) {
            for (const key of productKeys) {
                acc[key] = 0
            }
        }

        for (const key of productKeys) {
            const productLength = product[key].toString().length
            const accLength = acc[key]
            if (productLength > accLength) {
                acc[key] = productLength
            }
        }

    }

    let i = 0

    const accKeys = Object.keys(acc)

    for (const length in acc) {
        lengths.push([accKeys[i], acc[length] > accKeys[i].length ? acc[length] : accKeys[i].length])
        i++
    }

    return lengths
}

const writeExcel = async (wb, paths, name, Logger) => {
    return await new Promise((resolve, reject) => {
        wb.write(paths, function (err) {
            if (err) {
                reject(err)
            } else {
                Logger.log("SE HA GENERADO EL EXCEL CORRECTAMENTE EN: " + paths)
                paths = (path.join(PUBLIC_PATH, name)).replace(/\\/g, "\\\\")
                resolve(paths)
            }
        })
    })
}

export { calculatePages, calculateLenghtRows, writeExcel }