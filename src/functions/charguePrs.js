import needle from "needle"
const url = process.env.CUANTIA_URL

const chargeOrders = async (orders, token) => {
    return await needle('post', url, `{"query":"mutation ($data:[order]){ chargeOrders(data:$data){ orderNumber presupuesto {presupuestado correlativo documento status} } }", "variables":{"data": ${JSON.stringify(orders)}}}`, {
        headers: { 'content-type': 'application/json', 'Authorization': `${token}` }
    }).then((response) => {
        return response.body.data.chargeOrders
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

export { chargeOrders }