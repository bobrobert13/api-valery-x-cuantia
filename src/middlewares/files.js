import multer from "multer"
import path from "path"
const MEDIA_PATH = path.join(__dirname, "..", "..", "..", "..", "resources", "banners")

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const pathStorage = MEDIA_PATH
        cb(null, pathStorage);
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split(".").pop()
        const filename = `file-${Date.now()}.${ext}`
        cb(null, filename)
    },
});

const uploadFile = multer({ storage });

const validatorFile = (req, res, next) => {
    try {
        const mimetype = ['image/pjpeg', 'image/pjp', 'image/jfif', 'image/png', 'image/jpg', 'image/jpeg', 'image/svg']
        if (mimetype.find(mime => req.file.mimetype === mime)) {
            next()
            return
        }
        throw ["INVALID_FILE", req.file.mimetype]
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1])
        } else {
            handleHttpError(req, res, "UNKNOW_ERROR", 400, err)
        }
    }
}


export { uploadFile, validatorFile }