import needle from "needle";
const url = process.env.CUANTIA_URL

const updateCuantiaCurrencies = async (currenciesToUpdate, token) => {
    return await needle('post', url, `{"query":"mutation ($data:[tasa]){ actTasas(data:$data){ status } }", "variables":{"data": ${JSON.stringify(currenciesToUpdate)}}}`, {
        headers: { 'content-type': 'application/json', 'Authorization': `${token}` }
    }).then((response) => {
        return response.body.data.actTasas
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

export { updateCuantiaCurrencies }