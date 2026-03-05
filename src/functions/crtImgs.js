import needle from "needle";
const url = process.env.CUANTIA_URL

const queryMissingImages = async (token) => {
    return new Promise((resolve, reject) => {
        needle('post', url, `{"query":"query productsWithoutImages ($limit:Int){ productsWithoutImages(limit:$limit) }", "variables":{"limit":50 } }`, {
            headers: { 'content-type': 'application/json', 'Authorization': `${token}` },
            timeout:1000 * 60 * 2
        }).then((response) => {
            resolve(response.body.data.productsWithoutImages)
        }).catch((err) => {
            let errCode = []
            switch (err.code) {
                case 'ECONNREFUSED':
                    errCode = ["CUANTIA_CONNECT_FAILED", err, url]
                case 'ECONNRESET':
                    errCode = ["CUANTIA_CONNECT_FAILED", err, url]
                default:
                    errCode = ["UNKNOW_ERROR", err, "UNKNOW_PARAMS"]
            }
            reject(errCode)
        })
    })
}

const sendMissingImages = async (images, token) => {
    return new Promise((resolve, reject) => {
        needle('post', url, `{"query":"mutation sendMissingImages ($data:[updateImg]){ sendMissingImages(data:$data) {success failed} }", "variables":{"data":${JSON.stringify(images)} } }`, {
            headers: { 'content-type': 'application/json', 'Authorization': `${token}` },
            timeout:1000 * 60 * 2
        }).then((response) => {
            resolve(response.body.data.sendMissingImages)
        }).catch((err) => {
            let errCode = []
            switch (err.code) {
                case 'ECONNREFUSED':
                    errCode = ["CUANTIA_CONNECT_FAILED", err, url]
                case 'ECONNRESET':
                    errCode = ["CUANTIA_CONNECT_FAILED", err, url]
                default:
                    errCode = ["UNKNOW_ERROR", err, "UNKNOW_PARAMS"]
            }
            reject(errCode)
        })
    })
}


export { queryMissingImages, sendMissingImages }