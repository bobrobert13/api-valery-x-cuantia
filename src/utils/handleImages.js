import fs from "fs"
import path from "path"
const PUBLIC_URL = process.env.PUBLIC_URL
const MEDIA_PATH = path.join(__dirname, "..", "..", "..", "..", "resources", "products")
const PUBLIC_PATH = path.join(PUBLIC_URL, "products")

const createImageProduct = async (buffer, code) => {
    let pathImg = path.join(MEDIA_PATH, `${code}.jpg`)
    if (fs.existsSync(pathImg)) {
        return (path.join(PUBLIC_PATH, `${code}.jpg`)).replace(/\\/g, "\\\\")
    } else {
        return await new Promise((resolve, reject) => {
            fs.writeFile(pathImg, buffer, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve((path.join(PUBLIC_PATH, `${code}.jpg`)).replace(/\\/g, "\\\\"))
                }
            });
        })
    }
}

export { createImageProduct }