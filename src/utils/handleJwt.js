const JWT_SECRET = process.env.JWT_SECRET
import Jwt from 'jsonwebtoken'


const tokenSign = async (user) => {
    const sign = Jwt.sign({
        _id: user._id,
        role: user.role
    },
        JWT_SECRET, {
        expiresIn: user.role != "visor" ? "24h" : "3650d",
    }
    )
    let exp = Jwt.decode(sign, JWT_SECRET).exp
    return [sign, exp]
}

const verifyToken = async (tokenJwt) => {
    try {
        return Jwt.verify(tokenJwt, JWT_SECRET)
    }
    catch (err) {
        return err
    }
}

export { tokenSign, verifyToken }