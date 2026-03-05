import { handleHttpError } from "../utils/handleError";
import { Inventory } from "../models/inventory";
import { Audit } from "../models/audit";
import { Products } from "../models/products";
import { FDB } from "../config/databases/firebird"
import { processStocks } from "../functions/importProducts";
import { createImageProduct } from "../utils/handleImages";
import { calculatePages, calculateLenghtRows, writeExcel } from "../functions/inventory";
import moment from "moment";
const xl = require('excel4node')
import path from "path"
import { socket } from "../app";
moment.suppressDeprecationWarnings = true;
const _ = require('lodash');
const PUBLIC_URL = process.env.PUBLIC_URL
const MEDIA_PATH = path.join(__dirname, "..", "..", "..", "..", "resources", "excels")
const PUBLIC_PATH = path.join(PUBLIC_URL, "excels")
const Firebird = new FDB()

const getProducts = async (req, res) => {
    try {
        const { CODIGO_PRODUCTO, DEPARTAMENTO_PADRE, DEPARTAMENTO_HIJO, page, limit } = req.body.filters;
        const filter = !!CODIGO_PRODUCTO ? { CODIGO_PRODUCTO } : !DEPARTAMENTO_PADRE && !DEPARTAMENTO_HIJO ?
            {} : !!DEPARTAMENTO_PADRE && !DEPARTAMENTO_HIJO ? { DEPARTAMENTO_PADRE } : !!DEPARTAMENTO_PADRE && !!DEPARTAMENTO_HIJO ?
                { DEPARTAMENTO_HIJO } : { CODIGO_PRODUCTO: { $eq: "NO_PRODUCT_ID_RETURN_0_DOCUMENTS" } }

        const products = await Products.find(filter).skip((page - 1) * limit).limit(limit).lean()
        const total = await Products.countDocuments(filter)
        const pages = calculatePages(total, limit)

        const types = products.reduce((acc, product) => {
            const { SENSITIVE } = product
            if (acc["SENSITIVES"] === undefined && acc["NO_SENSITIVES"] === undefined) {
                acc["SENSITIVES"] = []
                acc["NO_SENSITIVES"] = []
            }

            !!SENSITIVE ? acc["SENSITIVES"].push(product) : acc["NO_SENSITIVES"].push(product)

            return acc;
        }, {});

        req.Logger.complete()
        res.status(200).json({ products, sensitives: types.SENSITIVES, noSensitives: types.NO_SENSITIVES, total, pages });
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1]);
            return;
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
    } finally {
        await req.Logger.save();
    }
};

const getProduct = async (req, res) => {
    try {
        await Firebird.connect()
        let cache = await Inventory.findOne({ CODIGO_PRODUCTO: req.body.product.code }).sort({ createdAt: -1 }).lean()
        if (!cache) {
            throw ["NO_PRODUCT_MATCH", JSON.stringify(req.body.product)]
        }
        const data = !cache.SENSITIVE && !!req.body.product.sensitiveAudit ?
            (() => {
                throw ["NO_SENSITIVE_PRODUCT", JSON.stringify({ CODIGO_PRODUCTO: cache.CODIGO_PRODUCTO, SENSITIVE: cache.SENSITIVE })]
            })() : await (async () => {
                return !!cache.SENSITIVE && !req.body.product.sensitiveAudit ? (() => {
                    throw ["SENSITIVE_PRODUCT", JSON.stringify({ CODIGO_PRODUCTO: cache.CODIGO_PRODUCTO, SENSITIVE: cache.SENSITIVE })]
                })() : await (async () => {
                    let updateProduct = await Firebird.query(`
                    select
                        productos_terminados.codigo_producto,
                        productos_terminados.nombre nombre_producto,
                        departamentos1.nombre departamento_padre,
                        departamentos.nombre departamento_hijo,
                        productos_terminados_depositos.existencia_actual,
                        productos_terminados_depositos.deposito_codigo,
                        productos_terminados.estatus
                    from departamentos departamentos1
                        inner join departamentos on (departamentos1.codigo = departamentos.departamento_padre)
                        inner join productos_terminados on (departamentos.codigo = productos_terminados.departamento_codigo)
                        inner join productos_terminados_depositos on (productos_terminados.codigo_producto = productos_terminados_depositos.producto_codigo) where productos_terminados.codigo_producto = '${req.body.product.code}'`)



                    let product = processStocks(updateProduct)

                    const blob = await Firebird.query(`select productos_terminados_foto.imagen, productos_terminados_foto.tipo from productos_terminados_foto where productos_terminados_foto.producto_codigo = '${req.body.product.code}' and productos_terminados_foto.tipo = 'PV'`);

                    let image = (path.join(PUBLIC_URL, "products", "default.png")).replace(/\\/g, "\\\\")

                    if (blob.length) {
                        const buffer = await Firebird.buffer(blob[0].IMAGEN);
                        image = await createImageProduct(buffer, req.body.product.code);
                    }

                    product = {
                        ...product[0],
                        CONTEO: cache.CONTEO,
                        SENSITIVE: cache.SENSITIVE,
                        STATUS: cache.STATUS,
                        USER: cache.USER,
                        COMMENT: cache.COMMENT,
                    };

                    delete product.image
                    delete cache._id
                    delete cache.DIFERENCIA
                    delete cache.auditId
                    delete cache.__v
                    delete cache.createdAt
                    delete cache.updatedAt

                    if ((JSON.stringify(product) != JSON.stringify(cache)) && cache.STATUS[0] != 'COMPLETADA') {

                        await Products.findOneAndUpdate({ CODIGO_PRODUCTO: product.CODIGO_PRODUCTO }, {
                            $set: product
                        }).sort({ createdAt: -1 })

                        await Inventory.findOneAndUpdate({ CODIGO_PRODUCTO: product.CODIGO_PRODUCTO }, {
                            $set: product
                        }).sort({ createdAt: -1 })
                    }

                    cache = await Inventory.findOne({ CODIGO_PRODUCTO: req.body.product.code }).sort({ createdAt: -1 }).lean()

                    delete product.EXISTENCIA_DETAL
                    delete product.EXISTENCIA_MAYOR
                    delete product.SENSITIVE

                    product["IMAGEN"] = image

                    product["EXISTENCIA_TOTAL"] = cache.EXISTENCIA_TOTAL

                    product["auditDate"] = moment(cache.updatedAt).format('YYYY-MM-DD h:mm:ss a')

                    product["DIFERENCIA"] = cache.DIFERENCIA

                    return product
                })()
            })()
        req.Logger.complete()
        res.status(200).json(data)
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1]);
            return;
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
    } finally {
        await req.Logger.save();
        await Firebird.detach()
    }
};

const getCategories = async (req, res) => {
    try {

        const products = await Products.find({}, {
            _id: 0,
            CODIGO_PRODUCTO: 0,
            EXISTENCIA_DETAL: 0,
            EXISTENCIA_MAYOR: 0,
            EXISTENCIA_TOTAL: 0,
            SENSITIVE: 0,
            createdAt: 0,
            updatedAt: 0,
            __v: 0
        }).lean()

        const departaments = products.reduce((acc, product) => {
            const { DEPARTAMENTO_PADRE, DEPARTAMENTO_HIJO } = product;
            if (acc[DEPARTAMENTO_PADRE] === undefined) {
                acc[DEPARTAMENTO_PADRE] = []
            }

            if (!acc[DEPARTAMENTO_PADRE].some((item) => item === DEPARTAMENTO_HIJO)) {
                acc[DEPARTAMENTO_PADRE].push(DEPARTAMENTO_HIJO)
            }
            return acc
        }, {});

        req.Logger.complete()
        res.status(200).json({ departaments });
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1]);
            return;
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
    } finally {
        await req.Logger.save();
    }
};

const setSensitives = async (req, res) => {
    try {
        let sensitives = [];
        let noSensitives = [];
        const audit = await Audit.findOne({ status: "PENDIENTE", sensitive: true }).lean();

        if (!!audit) {
            throw ["SENSITIVE_AUDIT_ACTIVE", JSON.stringify(audit)]
        }

        for (const product of req.body.products) {
            !!product.SENSITIVE
                ? sensitives.push(product)
                : noSensitives.push(product);
        }

        const updateSensitive = await Products.updateMany(
            {
                CODIGO_PRODUCTO: {
                    $in: sensitives.map((item) => {
                        return item.CODIGO_PRODUCTO;
                    }),
                },
            },
            { SENSITIVE: true }
        );

        const updateNoSensitive = await Products.updateMany(
            {
                CODIGO_PRODUCTO: {
                    $in: noSensitives.map((item) => {
                        return item.CODIGO_PRODUCTO;
                    }),
                },
            },
            { SENSITIVE: false }
        );

        let result = {
            result: true,
        };

        updateSensitive.modifiedCount + updateNoSensitive.modifiedCount !=
            sensitives.length + noSensitives.length
            ? (result.result = false)
            : result.result;
        !!result.result
            ? req.Logger.log("SE HAN MODIFICADO TODOS LOS PRODUCTOS")
            : (() => {
                req.Logger.warn("NO SE MODIFICARON LOS PRODUCTOS, ALGO SALIO MAL");
                throw [
                    "PRODUCTS_NOT_MODIFIED",
                    [
                        req.body.products,
                        [{ ...sensitives }, { ...updateSensitive }],
                        [{ ...noSensitives }, { ...updateNoSensitive }],
                    ],
                ];
            })();

        req.Logger.complete();

        res.status(200).json(result);
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1]);
            return;
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
    } finally {
        await req.Logger.save();
    }
};

const startSensitiveAudit = async (req, res) => {
    try {
        const count = await Products.countDocuments({ SENSITIVE: true, ESTATUS: 'A' })
        if (!count) {
            throw ["NO_SENSITIVE_PRODUCTS", JSON.stringify({ sensitiveProducts: count })]
        }
        const audit = await Audit.create({ user: req.user.email, sensitive: true, status: "PENDIENTE" });
        req.Logger.log(
            `EL SUPERVISOR ${req.user.email} HA INICIADO LA AUDITORIA ${audit.auditId}`
        );
        const products = await Products.find(
            { SENSITIVE: true, ESTATUS: 'A' },
            { _id: 0, updatedAt: 0, createdAt: 0, __v: 0 }
        ).lean();
        const inventoryProducts = await Inventory.insertMany(products);
        req.Logger.log(
            `LOS PRODUCTOS SENSIBLES QUE SE AUDITARAN SON LOS SIGUIENTES: ${inventoryProducts.map(
                (item) => {
                    return item.CODIGO_PRODUCTO;
                }
            )}`
        );
        req.Logger.complete();
        res.send({ create: true });
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1]);
            return;
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
    } finally {
        await req.Logger.save();
    }
};

const updateInventory = async (req, res) => {
    try {

        req.body.product = {
            ...req.body.product,
            count: parseFloat((parseFloat(req.body.product.count)).toFixed(2))
        }

        const audit = await Audit.findOne({ auditId: req.body.auditId })

        if (audit.status[0] != "PENDIENTE") {
            throw ["AUDIT_CLOSE", JSON.stringify(audit)]
        }

        const update = await Inventory.findOneAndUpdate({ CODIGO_PRODUCTO: req.body.product.code, auditId: req.body.auditId }, {
            $set: {
                STATUS: ["COMPLETADA"],
                CONTEO: req.body.product.count,
                USER: req.user.email,
                COMMENT: req.body.comment
            }
        }).then(async (result) => {
            return !!result ? await (async () => {
                result.DIFERENCIA = parseFloat((req.body.product.count).toFixed(2)) - result.EXISTENCIA_TOTAL
                await result.save()
                return { match: true, result: true }
            })() : await (async () => {
                return !!await Inventory.findOne({ CODIGO_PRODUCTO: req.body.product.code, auditId: req.body.auditId }) ? { match: true, result: false } : { match: false, result: false }
            })()
        })

        if (!update.match && !update.result) {
            throw ["NO_INVENTORY_MATCH", JSON.stringify({ match: update.match, status: update.result, ...req.body.product })]
        }

        req.Logger.complete();
        res.status(200).json({ match: update.match, status: update.result });
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1]);
            return;
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
    } finally {
        await req.Logger.save();
    }
};

const registerInventory = async (req, res) => {
    try {
        req.body.product = {
            ...req.body.product,
            count: parseFloat((parseFloat(req.body.product.count)).toFixed(2))
        }

        const audit = await Audit.findOne({ auditId: req.body.auditId })

        if (audit.status[0] != "PENDIENTE" || !audit) {
            throw ["AUDIT_CLOSE", JSON.stringify(audit)]
        }

        if (req.body.auditId.split("-")[1] == 'S') {
            const nsAudit = await Audit.findOne({ sensitive: false, status: "PENDIENTE" }, { user: 0, __v: 0, createdAt: 0, updatedAt: 0, sensitive: 0, status: 0, _id: 0 }).lean()
            const nsExist = await Inventory.findOne({ CODIGO_PRODUCTO: req.body.product.code, auditId: nsAudit.auditId })

            if (!!nsExist) {
                await Inventory.deleteOne({ CODIGO_PRODUCTO: req.body.product.code, auditId: nsAudit.auditId })
                req.Logger.warn(`EL PRODUCTO ${req.body.product.code} SE ENCONTRABA DUPLICADO EN LA AUDITORIA ${req.body.auditId} Y EN LA AUDITORIA ${nsAudit.auditId}, SE HA ELIMINADO DE LA AUDITORIA${nsAudit.auditId}`)
            }
        }

        const completed = await Inventory.findOne({ CODIGO_PRODUCTO: req.body.product.code, STATUS: ["COMPLETADA"], auditId: req.body.auditId })

        if (!!completed) {
            req.Logger.complete();
            res.status(200).json({ match: true, status: false, update: true });
            return
        }

        const update = await Inventory.findOneAndUpdate({ CODIGO_PRODUCTO: req.body.product.code, STATUS: { $ne: ["COMPLETADA"] }, auditId: req.body.auditId }, {
            $set: {
                STATUS: ["COMPLETADA"],
                CONTEO: parseFloat((req.body.product.count).toFixed(2)),
                USER: req.user.email,
                COMMENT: req.body.comment
            }
        }).then(async (result) => {
            return !!result ? await (async () => {
                result.DIFERENCIA = parseFloat((req.body.product.count).toFixed(2)) - result.EXISTENCIA_TOTAL
                await result.save()
                return { match: true, result: true }
            })() : await (async () => {
                return !!await Inventory.findOne({ CODIGO_PRODUCTO: req.body.product.code, auditId: req.body.auditId }) ? { match: true, result: false } : { match: false, result: false }
            })()
        })

        if (!update.match && !update.result) {
            throw ["NO_INVENTORY_MATCH", JSON.stringify({ match: update.match, status: update.result, ...req.body.product })]
        }

        req.Logger.complete();
        res.status(200).json({ match: update.match, status: update.result, update: false });
        socket.emit("noSensitiveLoad", true);
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1]);
            return;
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
    } finally {
        await req.Logger.save();
    }
};

const statusAudit = async (req, res) => {
    try {
        const { status, sensitive } = req.body.filters
        const audit = await Audit.findOne({ status, sensitive }).lean();
        let result = { ...audit, statusAudit: true }
        if (!audit) {
            result = { ...result, statusAudit: false }
        }
        req.Logger.log(
            `EL USUARIO ${req.user.email} HA CONSULTADO LA AUDITORIA ${!!audit ? audit.auditId : 'NO_AUDIT_MATCH'}`
        );
        req.Logger.complete();
        res.send(result);
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1]);
            return;
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
    } finally {
        await req.Logger.save();
    }
};

const auditClosure = async (req, res) => {
    try {
        const audit = await Audit.findOneAndUpdate({ auditId: req.body.auditId, status: { $ne: ["COMPLETADA"] }, sensitive: true }, { $set: { status: ["COMPLETADA"] } }).then(async (result) => {
            return !!result ? await (async () => {
                return { match: true, result: true }
            })() : await (async () => {
                return !!await Audit.findOne({ auditId: req.body.auditId, sensitive: true }) ? { match: true, result: false } : { match: false, result: false }
            })()
        })

        if (!audit.match && !audit.result) {
            throw ["NO_AUDIT_MATCH", JSON.stringify({ match: audit.match, status: audit.result, auditId: req.body.auditId })]
        }

        !!audit.result ? req.Logger.log(`EL SUPERVISOR ${req.user.email} HA CERRADO LA AUDITORIA ${req.body.auditId}`) : req.Logger.warn(`EL SUPERVISOR ${req.user.email} HA INTENTADO CERRAR LA AUDITORIA ${req.body.auditId}, PERO ESTA YA SE ENCUENTRA CERRADA`)
        req.Logger.complete();
        res.send({ match: audit.match, status: audit.result });
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1]);
            return;
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
    } finally {
        await req.Logger.save();
    }
};

const getInventory = async (req, res) => {
    try {
        let { auditId, STATUS, page, limit, filtros, user } = req.body.filters;
        let { input, departamentoPadre, departamentoHijo } = filtros
        
        if (!auditId) {
            throw ["NOT_AUDIT_MATCH", JSON.stringify(req.body.filters)]
        }

        !!input ? input = input.toUpperCase() : input

        let total = await Inventory.countDocuments({ auditId, ESTATUS: 'A' })
        let pages = calculatePages(total, limit)

        const audits = await Inventory.countDocuments({ auditId, STATUS: "COMPLETADA", ESTATUS: 'A' })

        const percentage = parseFloat(((audits / total) * 100).toFixed(3))

        let inventory = await (async () => {

            let data

            if (user == "admin") {
                data = await Inventory.aggregate([
                    {
                        '$match': !!departamentoPadre && !departamentoHijo ? {
                            'auditId': auditId,
                            'STATUS': !!STATUS ? { "$eq": STATUS } : { "$ne": null },
                            'ESTATUS': { "$eq": 'A' },
                            'DEPARTAMENTO_PADRE': departamentoPadre,
                            '$or': [
                                {
                                    'CODIGO_PRODUCTO': {
                                        '$regex': input
                                    }
                                }, {
                                    'NOMBRE_PRODUCTO': {
                                        '$regex': input
                                    }
                                }
                            ]
                        } : !!departamentoHijo && !!departamentoHijo ? {
                            'auditId': auditId,
                            'STATUS': !!STATUS ? { "$eq": STATUS } : { "$ne": null },
                            'DEPARTAMENTO_PADRE': departamentoPadre,
                            'DEPARTAMENTO_HIJO': departamentoHijo,
                            'ESTATUS': { "$eq": 'A' },
                            '$or': [
                                {
                                    'CODIGO_PRODUCTO': {
                                        '$regex': input
                                    }
                                }, {
                                    'NOMBRE_PRODUCTO': {
                                        '$regex': input
                                    }
                                }
                            ]
                        } : {
                            'auditId': auditId,
                            'STATUS': !!STATUS ? { "$eq": STATUS } : { "$ne": null },
                            'ESTATUS': { "$eq": 'A' },
                            '$or': [
                                {
                                    'CODIGO_PRODUCTO': {
                                        '$regex': input
                                    }
                                }, {
                                    'NOMBRE_PRODUCTO': {
                                        '$regex': input
                                    }
                                }
                            ]
                        }
                    }, {
                        '$group': {
                            '_id': '$auditId',
                            'productosCompletadosConDiferencia': {
                                '$push': {
                                    '$cond': [
                                        {
                                            '$and': [
                                                {
                                                    '$in': [
                                                        'COMPLETADA', '$STATUS'
                                                    ]
                                                }, {
                                                    '$ne': [
                                                        '$DIFERENCIA', 0
                                                    ]
                                                }
                                            ]
                                        }, '$$ROOT', null
                                    ]
                                }
                            },
                            'productosPendientes': {
                                '$push': {
                                    '$cond': [
                                        {
                                            '$in': [
                                                'PENDIENTE', '$STATUS'
                                            ]
                                        }, '$$ROOT', null
                                    ]
                                }
                            },
                            'productosCompletadosConDiferenciaCero': {
                                '$push': {
                                    '$cond': [
                                        {
                                            '$and': [
                                                {
                                                    '$in': [
                                                        'COMPLETADA', '$STATUS'
                                                    ]
                                                }, {
                                                    '$eq': [
                                                        '$DIFERENCIA', 0
                                                    ]
                                                }
                                            ]
                                        }, '$$ROOT', null
                                    ]
                                }
                            }
                        }
                    },
                    {
                        '$project': {
                            'productosCompletadosConDiferencia': {
                                '$filter': {
                                    'input': '$productosCompletadosConDiferencia',
                                    'as': 'producto',
                                    'cond': {
                                        '$ne': [
                                            '$$producto', null
                                        ]
                                    }
                                }
                            },
                            'productosPendientes': {
                                '$filter': {
                                    'input': '$productosPendientes',
                                    'as': 'producto',
                                    'cond': {
                                        '$ne': [
                                            '$$producto', null
                                        ]
                                    }
                                }
                            },
                            'productosCompletadosConDiferenciaCero': {
                                '$filter': {
                                    'input': '$productosCompletadosConDiferenciaCero',
                                    'as': 'producto',
                                    'cond': {
                                        '$ne': [
                                            '$$producto', null
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    {
                        '$project': {
                            'productosCompletadosConDiferencia': {
                                '$function': {
                                    'body': 'function(arr){return arr.sort((a,b) => Math.abs(b.DIFERENCIA) - Math.abs(a.DIFERENCIA))}',
                                    'args': [
                                        '$productosCompletadosConDiferencia'
                                    ],
                                    'lang': 'js'
                                }
                            },
                            'productosPendientes': '$productosPendientes',
                            'productosCompletadosConDiferenciaCero': '$productosCompletadosConDiferenciaCero'
                        }
                    },
                    {
                        '$project': {
                            'productos': {
                                '$concatArrays': [
                                    '$productosCompletadosConDiferencia', '$productosPendientes', '$productosCompletadosConDiferenciaCero'
                                ]
                            }
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$productos'
                        }
                    },
                    {
                        '$replaceRoot': {
                            'newRoot': '$productos'
                        }
                    },
                    {
                        '$skip': (page - 1) * limit
                    },
                    {
                        '$limit': limit
                    }
                ])
            } else {
                data = await Inventory.aggregate([
                    {
                        '$match': !!departamentoPadre ? {
                            'auditId': auditId,
                            'STATUS': !!STATUS ? { "$eq": STATUS } : { "$ne": null },
                            'ESTATUS': { "$eq": 'A' },
                            'DEPARTAMENTO_PADRE': departamentoPadre,
                            '$or': [
                                {
                                    'CODIGO_PRODUCTO': {
                                        '$regex': input
                                    }
                                }, {
                                    'NOMBRE_PRODUCTO': {
                                        '$regex': input
                                    }
                                }
                            ]
                        } : !!departamentoHijo ? {
                            'auditId': auditId,
                            'STATUS': !!STATUS ? { "$eq": STATUS } : { "$ne": null },
                            'DEPARTAMENTO_PADRE': departamentoPadre,
                            'DEPARTAMENTO_HIJO': departamentoHijo,
                            'ESTATUS': { "$eq": 'A' },
                            '$or': [
                                {
                                    'CODIGO_PRODUCTO': {
                                        '$regex': input
                                    }
                                }, {
                                    'NOMBRE_PRODUCTO': {
                                        '$regex': input
                                    }
                                }
                            ]
                        } : {
                            'auditId': auditId,
                            'STATUS': !!STATUS ? { "$eq": STATUS } : { "$ne": null },
                            'ESTATUS': { "$eq": 'A' },
                            '$or': [
                                {
                                    'CODIGO_PRODUCTO': {
                                        '$regex': input
                                    }
                                }, {
                                    'NOMBRE_PRODUCTO': {
                                        '$regex': input
                                    }
                                }
                            ]
                        }
                    }, {
                        '$group': {
                            '_id': '$auditId',
                            'productosCompletadosConDiferencia': {
                                '$push': {
                                    '$cond': [
                                        {
                                            '$and': [
                                                {
                                                    '$in': [
                                                        'COMPLETADA', '$STATUS'
                                                    ]
                                                }, {
                                                    '$ne': [
                                                        '$DIFERENCIA', 0
                                                    ]
                                                }
                                            ]
                                        }, '$$ROOT', null
                                    ]
                                }
                            },
                            'productosPendientes': {
                                '$push': {
                                    '$cond': [
                                        {
                                            '$in': [
                                                'PENDIENTE', '$STATUS'
                                            ]
                                        }, '$$ROOT', null
                                    ]
                                }
                            }
                        }
                    },
                    {
                        '$project': {
                            'productosCompletadosConDiferencia': {
                                '$filter': {
                                    'input': '$productosCompletadosConDiferencia',
                                    'as': 'producto',
                                    'cond': {
                                        '$ne': [
                                            '$$producto', null
                                        ]
                                    }
                                }
                            },
                            'productosPendientes': {
                                '$filter': {
                                    'input': '$productosPendientes',
                                    'as': 'producto',
                                    'cond': {
                                        '$ne': [
                                            '$$producto', null
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    {
                        '$project': {
                            'productosCompletadosConDiferencia': {
                                '$function': {
                                    'body': 'function(arr){return arr.sort((a,b) => Math.abs(b.DIFERENCIA) - Math.abs(a.DIFERENCIA))}',
                                    'args': [
                                        '$productosCompletadosConDiferencia'
                                    ],
                                    'lang': 'js'
                                }
                            },
                            'productosPendientes': '$productosPendientes'
                        }
                    },
                    {
                        '$project': {
                            'productos': {
                                '$concatArrays': [
                                    '$productosCompletadosConDiferencia', '$productosPendientes'
                                ]
                            }
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$productos'
                        }
                    },
                    {
                        '$replaceRoot': {
                            'newRoot': '$productos'
                        }
                    },
                    {
                        '$skip': (page - 1) * limit
                    },
                    {
                        '$limit': limit
                    }
                ])
            }

            if (auditId.split("-")[1] == 'S') {
                for (const product of data) {
                    const nsAudit = await Audit.findOne({ sensitive: false, status: "PENDIENTE" }, { user: 0, __v: 0, createdAt: 0, updatedAt: 0, sensitive: 0, status: 0, _id: 0 }).lean()
                    const nsExist = await Inventory.findOne({ CODIGO_PRODUCTO: product.CODIGO_PRODUCTO, auditId: nsAudit.auditId })

                    if (!!nsExist) {
                        await Inventory.deleteOne({ CODIGO_PRODUCTO: product.CODIGO_PRODUCTO, auditId: nsAudit.auditId })
                        req.Logger.warn(`EL PRODUCTO ${product.CODIGO_PRODUCTO} SE ENCONTRABA DUPLICADO EN LA AUDITORIA ${auditId} Y EN LA AUDITORIA ${nsAudit.auditId}, SE HA ELIMINADO DE LA AUDITORIA ${nsAudit.auditId}`)
                    }
                }
            }

            if (!STATUS) {
                total = await Inventory.countDocuments({
                    auditId,
                    '$or': [
                        {
                            'CODIGO_PRODUCTO': {
                                '$regex': input
                            }
                        }, {
                            'NOMBRE_PRODUCTO': {
                                '$regex': input
                            }
                        }
                    ]
                })
            } else {
                total = await Inventory.countDocuments({
                    auditId,
                    STATUS: STATUS,
                    ESTATUS: 'A',
                    '$or': [
                        {
                            'CODIGO_PRODUCTO': {
                                '$regex': input
                            }
                        }, {
                            'NOMBRE_PRODUCTO': {
                                '$regex': input
                            }
                        }
                    ]
                })
            }

            pages = calculatePages(total, limit)

            return data

        })()

        inventory = inventory.map((item) => {
            return {
                ...item,
                updatedAt: moment(item.updatedAt).format('YYYY-MM-DD h:mm:ss a')
            }
        })

        const result = { inventory, total, audits, percentage, pages }

        req.Logger.log(`SE HA CONSULTADO EL INVENTARIO DE LA AUDITORIA ${auditId}`);

        req.Logger.complete();

        res.status(200).json(result)
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1]);
            return;
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
    } finally {
        await req.Logger.save();
    }
};

const getAudits = async (req, res) => {
    try {
        let parseAudits = []
        const { page, limit } = req.body.filters;
        const filter = { status: ["COMPLETADA"] }
        let audits = await Audit.find(filter, { _id: 0, __v: 0, status: 0 }).skip((page - 1) * limit).limit(limit).lean()
        for (const item of audits) {
            const products = await Inventory.find({ auditId: item.auditId }).lean()
            let audit = ({
                auditId: item.auditId,
                sensitive: item.sensitive,
                user: item.user,
                inicio: item.createdAt,
                cierre: item.updatedAt,
                ...products.reduce((acc, product) => {
                    if (
                        !acc["differences"]
                        &&
                        !acc["counted"]
                        &&
                        !acc["notCounted"]
                        &&
                        !acc["diferencias"]
                        &&
                        !acc["inventario"]) {

                        acc["differences"] = []
                        acc["counted"] = []
                        acc["notCounted"] = []
                        acc["inventario"] = []
                        acc["diferencias"] = []
                    }

                    if (product.STATUS[0] == "COMPLETADA") {
                        acc["inventario"].push(product)
                    }

                    if (product.STATUS[0] == "COMPLETADA" && (product.DIFERENCIA < 0 || product.DIFERENCIA > 0)) {
                        acc["diferencias"].push(product)
                    }

                    product.STATUS[0] == "COMPLETADA" && (product.DIFERENCIA < 0 || product.DIFERENCIA > 0) ? acc["differences"].push(product)
                        : product.STATUS[0] == "COMPLETADA" && product.DIFERENCIA == 0 ? acc["counted"].push(product) : acc["notCounted"].push(product)

                    return acc
                }, {})
            })

            audit["differences"] = audit.differences.reduce((acc, product) => {
                const { DEPARTAMENTO_PADRE, DEPARTAMENTO_HIJO } = product;
                if (acc[DEPARTAMENTO_PADRE] === undefined) {
                    acc[DEPARTAMENTO_PADRE] = { __TOTAL: 0 }
                }
                acc[DEPARTAMENTO_PADRE].__TOTAL += 1
                if (acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] === undefined) {
                    acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] = 0
                }
                acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] += 1
                acc.__TOTAL += 1
                acc.__PERCENTAGE = parseFloat(((acc.__TOTAL / products.length) * 100).toFixed(3))
                return acc
            }, { __TOTAL: 0, __PERCENTAGE: 0 })

            audit["counted"] = audit.counted.reduce((acc, product) => {
                const { DEPARTAMENTO_PADRE, DEPARTAMENTO_HIJO } = product;
                if (acc[DEPARTAMENTO_PADRE] === undefined) {
                    acc[DEPARTAMENTO_PADRE] = { __TOTAL: 0 }
                }
                acc[DEPARTAMENTO_PADRE].__TOTAL += 1

                if (acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] === undefined) {
                    acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] = 0
                }
                acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] += 1
                acc.__TOTAL += 1
                acc.__PERCENTAGE = parseFloat(((acc.__TOTAL / products.length) * 100).toFixed(3))
                return acc
            }, { __TOTAL: 0, __PERCENTAGE: 0 })

            audit["notCounted"] = audit.notCounted.reduce((acc, product) => {
                const { DEPARTAMENTO_PADRE, DEPARTAMENTO_HIJO } = product;
                if (acc[DEPARTAMENTO_PADRE] === undefined) {
                    acc[DEPARTAMENTO_PADRE] = { __TOTAL: 0 }
                }
                acc[DEPARTAMENTO_PADRE].__TOTAL += 1
                if (acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] === undefined) {
                    acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] = 0
                }
                acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] += 1
                acc.__TOTAL += 1

                acc.__PERCENTAGE = parseFloat(((acc.__TOTAL / products.length) * 100).toFixed(3))
                return acc
            }, { __TOTAL: 0, __PERCENTAGE: 0 })

            audit["inventario"] = audit.inventario.reduce((acc, product) => {
                const { DEPARTAMENTO_PADRE, DEPARTAMENTO_HIJO } = product;
                if (acc[DEPARTAMENTO_PADRE] === undefined) {
                    acc[DEPARTAMENTO_PADRE] = { __TOTAL: 0 }
                }

                acc[DEPARTAMENTO_PADRE].__TOTAL += 1
                if (acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] === undefined) {
                    acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] = 0
                }
                acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] += 1
                acc.__TOTAL += 1

                acc.__PERCENTAGE = parseFloat(((acc.__TOTAL / products.length) * 100).toFixed(3))
                return acc
            }, { __TOTAL: 0, __PERCENTAGE: 0 })

            audit["diferencias"] = audit.diferencias.reduce((acc, product) => {
                const { DEPARTAMENTO_PADRE, DEPARTAMENTO_HIJO } = product;
                if (acc[DEPARTAMENTO_PADRE] === undefined) {
                    acc[DEPARTAMENTO_PADRE] = { __TOTAL: 0 }
                }

                acc[DEPARTAMENTO_PADRE].__TOTAL += 1
                if (acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] === undefined) {
                    acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] = 0
                }
                acc[DEPARTAMENTO_PADRE][DEPARTAMENTO_HIJO] += 1
                acc.__TOTAL += 1

                acc.__PERCENTAGE = parseFloat(((acc.__TOTAL / audit.inventario.__TOTAL) * 100).toFixed(3))
                return acc
            }, { __TOTAL: 0, __PERCENTAGE: 0 })

            parseAudits.push(audit)
        }

        parseAudits = _.groupBy(parseAudits, (audit) => {
            return moment(audit.inicio)
        })

        let fechas = Object.keys(parseAudits)

        fechas = fechas.sort((a, b) => {
            return moment(b) - moment(a)
        })

        let newParseAudits = {}

        for (const fecha of fechas) {
            newParseAudits[fecha] = parseAudits[fecha]
        }

        let auditsReturn = []

        for (const audit in newParseAudits) {
            newParseAudits[audit] = newParseAudits[audit].map((item) => {
                return {
                    ...item,
                    inicio: moment(item.inicio).format('YYYY-MM-DD h:mm:ss a'),
                    cierre: moment(item.cierre).format('YYYY-MM-DD h:mm:ss a')
                }
            })

            for (const item of newParseAudits[audit]) {
                auditsReturn.push(item)
            }
        }

        const total = await Audit.countDocuments(filter)

        const pages = calculatePages(total, limit)

        res.status(200).json({ audits: auditsReturn, total, pages })

    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1]);
            return;
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
    } finally {
        await req.Logger.save();
    }
};

const getAuditDetails = async (req, res) => {
    try {
        const { auditID, listType, category, subcategory } = req.body.filters;
        const audit = await Audit.findOne({ auditId: auditID }).lean();

        if (audit.status.indexOf("COMPLETADA") < 0) {
            throw ["AUDIT_NOT_COMPLETED", auditID];
        }

        let products = await Inventory.aggregate([
            [
                {
                    $match: {
                        auditId: auditID,
                        DEPARTAMENTO_PADRE: category,
                        DEPARTAMENTO_HIJO: subcategory,
                    },
                },
                {
                    $addFields: {
                        apertura: {
                            $dateToString: {
                                date: "$createdAt"
                            }
                        },
                        audicion: {
                            $dateToString: {
                                date: "$updatedAt"
                            }
                        },
                        absDiff: { $abs: "$DIFERENCIA" },
                        type: {
                            $switch: {
                                branches: [
                                    {
                                        case: {
                                            $and: [
                                                {
                                                    $ne: ["$DIFERENCIA", 0],
                                                },
                                                {
                                                    $in: ["COMPLETADA", "$STATUS"],
                                                },
                                            ],
                                        },
                                        then: "difference",
                                    },
                                    {
                                        case: {
                                            $and: [
                                                {
                                                    $eq: ["$DIFERENCIA", 0],
                                                },
                                                {
                                                    $in: ["COMPLETADA", "$STATUS"],
                                                },
                                            ],
                                        },
                                        then: "counted",
                                    },
                                ],
                                default: "uncounted",
                            },
                        },
                    },
                },
                {
                    $match: {
                        type: listType,
                    },
                },
                {
                    $sort: {
                        absDiff: -1,
                        NOMBRE_PRODUCTO: 1
                    }
                },
                {
                    $project: {
                        SENSITIVE: 0,
                        EXISTENCIA_MAYOR: 0,
                        EXISTENCIA_DETAL: 0,
                        createdAt: 0,
                        updatedAt: 0,
                        auditId: 0
                    }
                }
            ],
        ]);

        products = products.map((item) => {
            return {
                ...item,
                apertura: moment(item.apertura).format('YYYY-MM-DD h:mm:ss a'),
                audicion: moment(item.audicion).format('YYYY-MM-DD h:mm:ss a')
            }
        })

        res.status(200).json(products);
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

const generateExcel = async (req, res) => {
    try {
        let { from, to, auditId } = req.body.filters
        if (!from && !to) {
            from = req.body.filters
            to = req.body.filters
        }
        let audits
        if (!!auditId) {
            audits = await Audit.find({ auditId }).lean()
        } else {
            audits = await Audit.find({
                status: "COMPLETADA", "$and": [
                    { createdAt: { "$gte": moment(from) } },
                    { createdAt: { "$lte": ((moment(to).add(23, "h")).add(59, "m")).add(59, "s") } }
                ]
            }).lean()
        }
        if (!audits.length) {
            throw ["NO_AUDITS_MATCH", JSON.stringify({ audits })]
        }
        const nameExcel = !auditId ? `HIS_${`${from.split("/")[0]}-${from.split("/")[1]}-${from.split("/")[2]}`}_${`${to.split("/")[0]}-${to.split("/")[1]}-${to.split("/")[2]}`}.xlsx` : `${audits[0].auditId}_${moment(audits[0].createdAt).format('YYYY-MM-DD')}.xlsx`
        const pathExcel = path.join(__dirname, "..", "..", "..", "..", "resources", "excels", nameExcel)
        let wb = new xl.Workbook()
        let ws = wb.addWorksheet('Auditoria')

        const products = await (async () => {
            let concatProducts = []
            for (const audit of audits) {
                let product = (await Inventory.aggregate([
                    {
                        '$match': {
                            'auditId': audit.auditId,
                        }
                    }, {
                        '$group': {
                            '_id': '$auditId',
                            'productosCompletadosConDiferencia': {
                                '$push': {
                                    '$cond': [
                                        {
                                            '$and': [
                                                {
                                                    '$in': [
                                                        'COMPLETADA', '$STATUS'
                                                    ]
                                                }, {
                                                    '$ne': [
                                                        '$DIFERENCIA', 0
                                                    ]
                                                }
                                            ]
                                        }, '$$ROOT', null
                                    ]
                                }
                            },
                            'productosPendientes': {
                                '$push': {
                                    '$cond': [
                                        {
                                            '$in': [
                                                'PENDIENTE', '$STATUS'
                                            ]
                                        }, '$$ROOT', null
                                    ]
                                }
                            },
                            'productosCompletadosConDiferenciaCero': {
                                '$push': {
                                    '$cond': [
                                        {
                                            '$and': [
                                                {
                                                    '$in': [
                                                        'COMPLETADA', '$STATUS'
                                                    ]
                                                }, {
                                                    '$eq': [
                                                        '$DIFERENCIA', 0
                                                    ]
                                                }
                                            ]
                                        }, '$$ROOT', null
                                    ]
                                }
                            }
                        }
                    },
                    {
                        '$project': {
                            'productosCompletadosConDiferencia': {
                                '$filter': {
                                    'input': '$productosCompletadosConDiferencia',
                                    'as': 'producto',
                                    'cond': {
                                        '$ne': [
                                            '$$producto', null
                                        ]
                                    }
                                }
                            },
                            'productosPendientes': {
                                '$filter': {
                                    'input': '$productosPendientes',
                                    'as': 'producto',
                                    'cond': {
                                        '$ne': [
                                            '$$producto', null
                                        ]
                                    }
                                }
                            },
                            'productosCompletadosConDiferenciaCero': {
                                '$filter': {
                                    'input': '$productosCompletadosConDiferenciaCero',
                                    'as': 'producto',
                                    'cond': {
                                        '$ne': [
                                            '$$producto', null
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    {
                        '$project': {
                            'productosCompletadosConDiferencia': {
                                '$function': {
                                    'body': 'function(arr){return arr.sort((a,b) => Math.abs(b.DIFERENCIA) - Math.abs(a.DIFERENCIA))}',
                                    'args': [
                                        '$productosCompletadosConDiferencia'
                                    ],
                                    'lang': 'js'
                                }
                            },
                            'productosPendientes': '$productosPendientes',
                            'productosCompletadosConDiferenciaCero': '$productosCompletadosConDiferenciaCero'
                        }
                    },
                    {
                        '$project': {
                            'productos': {
                                '$concatArrays': [
                                    '$productosCompletadosConDiferencia', '$productosPendientes', '$productosCompletadosConDiferenciaCero'
                                ]
                            }
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$productos'
                        }
                    },
                    {
                        '$replaceRoot': {
                            'newRoot': '$productos'
                        }
                    }
                ])).map((item) => {
                    return {
                        AUDITORIA: audit.auditId,
                        'FECHA INICIO': moment(audit.createdAt).format('YYYY-MM-DD h:mm:ss a'),
                        'FECHA CIERRE': moment(audit.updatedAtt).format('YYYY-MM-DD h:mm:ss a'),
                        USUARIO: item.USER,
                        'FECHA AUDITORIA': item.STATUS[0] == "COMPLETADA" ? moment(item.updatedAt).format('YYYY-MM-DD h:mm:ss a') : "",
                        'DEPARTAMENTO PADRE': item.DEPARTAMENTO_PADRE,
                        'DEPARTAMENTO HIJO': item.DEPARTAMENTO_HIJO,
                        'CODIGO PRODUCTO': item.CODIGO_PRODUCTO,
                        'NOMBRE PRODUCTO': item.NOMBRE_PRODUCTO,
                        'EXISTENCIA TOTAL': item.EXISTENCIA_TOTAL,
                        CONTEO: item.CONTEO,
                        DIFERENCIA: item.DIFERENCIA,
                        ESTATUS: item.STATUS[0]
                    }
                })
                concatProducts = concatProducts.concat(product)
            }
            return concatProducts
        })()

        const keys = calculateLenghtRows(products)
        let i = 1
        for (const key of keys) {
            ws.cell(1, i).string(key[0])
            ws.column(i).setWidth(Math.ceil((key[1]) * 12) / 7)
            i++
        }
        let x = 2
        for (const product of products) {
            let y = 1
            for (const value in product) {
                ws.cell(x, y).string(product[value].toString())
                y++
            }
            x++
        }
        const excel = await writeExcel(wb, pathExcel, nameExcel, req.Logger)

        req.Logger.complete()
        res.status(200).json({ excel, name: pathExcel })
    } catch (err) {
        if (Array.isArray(err)) {
            handleHttpError(req, res, err[0], 400, err[1]);
            return;
        }
        handleHttpError(req, res, err.toString(), 400, "UNKNOW_PARAMS", "UNKNOW_ERROR");
    } finally {
        await req.Logger.save();
    }
};

export {
    getProducts,
    setSensitives,
    startSensitiveAudit,
    getProduct,
    updateInventory,
    statusAudit,
    auditClosure,
    getInventory,
    getAudits,
    getAuditDetails,
    getCategories,
    registerInventory,
    generateExcel
};
