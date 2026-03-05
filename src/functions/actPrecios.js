import needle from "needle";
const url = process.env.CUANTIA_URL
const updateCuantiaProducts = async (productsToUpdate, token) => {
    return await needle('post', url, `{"query":"mutation ($data:[data]){ actProducts(data:$data){ status success failed remaining ignored created } }", "variables":{"data": ${JSON.stringify(productsToUpdate)}}}`, {
        headers: { 'content-type': 'application/json', 'Authorization': `${token}` },
        timeout:1000 * 60 * 50
    }).then((response) => {
        return response.body.data.actProducts
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


export { updateCuantiaProducts }