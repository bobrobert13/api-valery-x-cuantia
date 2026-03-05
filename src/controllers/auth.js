import { tokenSign } from "../utils/handleJwt";
import { handleHttpError } from "../utils/handleError";
import { compare, encrypt } from "../utils/handlePassword";
import { User } from "../models/user";

const registerUser = async (req, res) => {
  try {
    const password = await encrypt(req.body.user.password);
    const body = {
      email: req.body.user.email,
      password,
      role: req.body.user.role,
    };
    const dataUser = await User.create(body);

    const data = {
      token: await tokenSign(dataUser),
      user: dataUser,
    };

    req.Logger.complete();
    res.send({ data });
  } catch (err) {
    if (Array.isArray(err)) {
      handleHttpError(req, res, err[0], 400, err[1]);
      return;
    }
    handleHttpError(
      req,
      res,
      err.toString(),
      400,
      "UNKNOW_PARAMS",
      "UNKNOW_ERROR"
    );
  }
};

const loginUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.user.email });
    if (!user) {
      throw ["USER_NOT_EXISTS", req.body.user.email];
    }
    const hashPassword = user.get("password");
    const check = await compare(req.body.user.password, hashPassword);
    if (!check) {
      throw ["PASSWORD_INVALID", req.body.user.password];
    } else {
      let sign = await tokenSign(user);
      const token = {
        code: sign[0],
        expire: sign[1],
      };
      req.Logger.complete();
      res.send({ token, user });
    }
  } catch (err) {
    if (Array.isArray(err)) {
      handleHttpError(req, res, err[0], 400, err[1]);
      return;
    }
    handleHttpError(
      req,
      res,
      err.toString(),
      400,
      "UNKNOW_PARAMS",
      "UNKNOW_ERROR"
    );
  } finally {
    await req.Logger.save();
  }
};

export { loginUser, registerUser };
