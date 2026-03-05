import needle from "needle";
const url = process.env.CUANTIA_URL
const getCuantiaDepartaments = async (token) => {
    return await needle('post', url, `{"query":"query getDepartamentos{ getDepartamentos{ Categories Subcategories } }"}`, {
        headers: { 'content-type': 'application/json', 'Authorization': `${token}` }
    }).then((response) => {
        return response.body.data.getDepartamentos
    }).catch((err) => {
        switch (err.code) {
            case 'ECONNREFUSED':
                throw ["CUANTIA_CONNECT_FAILED", err, url]
            case 'ECONNRESET':
                throw ["CUANTIA_CONNECT_FAILED", err, url]
            default:
                throw ["UNKNOW_ERROR", err, "UNKNOW_PARAMS"]
        }
    })
}

const setCatAndSubImgs = async (images, token) => {
    return new Promise((resolve, reject) => {
        needle('post', url, `{"query":"mutation setCatAndSubImgs ($data:DepartamentosImgs){ setCatAndSubImgs(data:$data) }", "variables":{"data":${JSON.stringify(images)} } }`, {
            headers: { 'content-type': 'application/json', 'Authorization': `${token}` },
            timeout:1000 * 60 * 2
        }).then((response) => {
            resolve(response.body.data.setCatAndSubImgs)
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


export { getCuantiaDepartaments, setCatAndSubImgs }