// import { check } from "express-validator"
// import { validateResults } from "../utils/handleValidator"

// const validatorRegisterUser =
//     [
//         check("userName")
//         .exists()
//         .notEmpty(),
//         check("email")
//         .exists()
//         .notEmpty()
//         .isEmail(),
//         check("password")
//         .exists()
//         .notEmpty()
//         .isLength({min:3, max:15}),
//         (req, res, next) =>
//             {
//                 return validateResults(req, res, next)
//             }
//     ]

// const validatorLoginUser =
//     [
//         check("email")
//         .exists()
//         .notEmpty()
//         .isEmail(),
//         check("password")
//         .exists()
//         .notEmpty()
//         .isLength({min:3, max:15}),
//         (req, res, next) =>
//             {
//                 return validateResults(req, res, next)
//             }
//     ]

// export { validatorRegisterUser, validatorLoginUser }