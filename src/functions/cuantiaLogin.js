import needle from 'needle'
import { Data } from '../models/data'

const url = process.env.CUANTIA_URL

const authCuantia = async () => {
    let credenciales = (await Data.findOne().lean()).credentials

    return await needle('post', url, `{"query":"query($data:Auth) { Login(data: $data){token { code }}}", "variables":{"data": ${JSON.stringify(credenciales)}}}`, {
        headers: { 'content-type': 'application/json' },
        timeout:1000 * 60 * 2
    }).then((response) => {
        if (response.body.errors) {
            return ["AUTH_ERROR", response.body.errors[0].message, JSON.stringify(credenciales)]
        }
        return response.body.data.Login.token.code
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

export { authCuantia }