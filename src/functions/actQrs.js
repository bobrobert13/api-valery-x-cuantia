import QRcode from 'qrcode'
import path from 'path'
const Jimp = require('jimp')
const qrsPath = path.join(__dirname, "..", "..", "..", "..", "resources", "qrs")

async function generateQrs(codes, Logger) {
    try {
        let qrsBuffersPaths = []
        for (const code of codes) {
            await generateQr(code, Logger).then((result) => {
                QRcode.toString(code, { small: true, color: { dark: '#FFFFFF', light: '#0422B4' } }, function (err, string) {
                    if (err) throw err
                    console.log(string)
                })
                qrsBuffersPaths.push([result, code])
            })
        }
        return qrsBuffersPaths
    } catch (err) {
        throw ["GENERATE_QRS_ERROR", err.toString(), codes.toString()]
    }
}

async function generateQr(code, Logger) {
    return new Promise((resolve, reject) => {
        const qrPath = path.join(qrsPath, `${code}.png`)
        QRcode.toFile(qrPath, code, { scale: 10, margin: 0 }, async function (err) {
            if (err) {
                reject([code, err])
            }
            else {
                Logger.log(`SE HA GENERADO EL QR DE: ${code}`)
                await convertJPG(qrPath, code, Logger).then((result) => {
                    resolve(result)
                }).catch((err) => {
                    reject(err)
                })
            }
        })
    })
}

async function convertJPG(dir, code, Logger) {
    return new Promise((resolve, rejected) => {
        Jimp.read(dir, function (err, image) {
            if (err) {
                rejected(err)
            }
            else {
                let jpgQrPath = path.join(qrsPath, `${code}.jpg`)
                image.write(jpgQrPath)
                Logger.log(`SE HA CONVERTIDO EL ARCHIVO: ${code}.png AL ARCHIVO: ${code}.jpg`)
                resolve(jpgQrPath)
            }
        });
    })
}

export { generateQrs }
