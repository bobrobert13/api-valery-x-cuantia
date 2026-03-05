import { handleHttpError } from "../utils/handleError"
import { verifyToken } from "../utils/handleJwt"
import { User } from "../models/user"


const authenticator = async (req, res, next) => {

    try {
        if (!req.headers.authorization) {
            throw ["NEED_SESSION", JSON.stringify({ authorization: typeof req.headers.authorization })]
        }
        const token = req.headers.authorization.split(' ').pop()
        const dataToken = await verifyToken(token)
        if (!dataToken._id) {
            throw ["ERROR_ID_TOKEN", JSON.stringify(dataToken)]
        }
        const user = await User.findById(dataToken._id)
        req.user = user
        next()
    }
    catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
        } else {
            handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
        }
    }
}

const roleChecker = (roles) => (req, res, next) => {
    try {
        const { user } = req
        const userRoles = user.role
        const checkValueRol = roles.some((rolSingle) => userRoles.includes(rolSingle))

        if (!checkValueRol) {
            throw ["USER_NOT_PERMISSIONS", userRoles.toString()]
        }

        next()
    }
    catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
        } else {
            handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR")
        }
    }
}

export { authenticator, roleChecker }