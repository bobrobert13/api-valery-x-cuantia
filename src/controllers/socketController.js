import { handleHttpError } from "../utils/handleError";
import { Inventory } from "../models/inventory";
import { Audit } from "../models/audit";
import { Products } from "../models/products";
import { FDB } from "../config/databases/firebird"
import { processStocks } from "../functions/importProducts";
import { createImageProduct } from "../utils/handleImages";
import { calculatePages } from "../functions/inventory";
import moment from "moment";
import path from "path"
import { socket } from "../app";
moment.suppressDeprecationWarnings = true;
const _ = require('lodash');
const PUBLIC_URL = process.env.PUBLIC_URL
const Firebird = new FDB()

export const getInventorySocket = async (filters) => {
    try {

        let { auditId, STATUS, page, limit, input } = filters;

        if (!auditId) {
            throw ["NOT_AUDIT_MATCH", JSON.stringify(req.body.filters)]
        }

        !!input ? input = input.toUpperCase() : input

        let total = await Inventory.countDocuments({ auditId, ESTATUS: 'A' })
        let pages = calculatePages(total, limit)

        const audits = await Inventory.countDocuments({ auditId, STATUS: "COMPLETADA", ESTATUS: 'A' })

        const percentage = parseFloat(((audits / total) * 100).toFixed(3))

        const inventory = await (async () => {

            const data = await Inventory.aggregate([
                {
                    '$match': {
                        'auditId': auditId,
                        'STATUS': !!STATUS ? { "$eq": STATUS } : { "$ne": null },
                        'ESTATUS': {"$eq": 'A'},
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
                    'ESTATUS': {"$eq": 'A'},
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