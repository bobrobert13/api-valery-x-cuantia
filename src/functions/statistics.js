import needle from "needle";
const url = process.env.CUANTIA_URL
const updateHistorialTasaBCV = async (historialTasa, token) => {
    return await needle('post', url, `{"query":"mutation ($data:[historialTasaBCVInput]){ updateHistorialTasaBCV(data:$data) }", "variables":{"data": ${JSON.stringify(historialTasa)}}}`, {
        headers: { 'content-type': 'application/json', 'Authorization': `${token}` },
        timeout:1000 * 60 * 50
    }).then((response) => {
        return response.body.data.updateHistorialTasaBCV
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

const getHistorialTasaBCV = async(token) => {
    return await needle('post', url, `{"query":"query { getHistorialTasaBCVDates }"}`, {
        headers: { 'content-type': 'application/json', 'Authorization': `${token}` },
        timeout:1000 * 60 * 50
    }).then((response) => {
        return response.body.data.getHistorialTasaBCVDates
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

const updateHistorialCostoInventario= async (historialCosto, token) => {
    return await needle('post', url, `{"query":"mutation ($data:[historialCostoInventarioInput]){ updateHistorialCostoInventario(data:$data) }", "variables":{"data": ${JSON.stringify(historialCosto)}}}`, {
        headers: { 'content-type': 'application/json', 'Authorization': `${token}` },
        timeout:1000 * 60 * 50
    }).then((response) => {
        return response.body.data.updateHistorialCostoInventario
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

const getHistoriaCostoInventario = async(startDate, endDate, token) => {
    return await needle('post', url, `{"query":"query ($startDate:String, $endDate:String) { getHistorialCostoInventario(startDate:$startDate, endDate:$endDate) }", "variables":{"startDate":"${startDate.getTime()}", "endDate":"${endDate.getTime()}"}}`, {
        headers: { 'content-type': 'application/json', 'Authorization': `${token}` },
        timeout:1000 * 60 * 50
    }).then((response) => {
        return response.body.data.getHistorialCostoInventario
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

export { updateHistorialTasaBCV, getHistorialTasaBCV, updateHistorialCostoInventario, getHistoriaCostoInventario}