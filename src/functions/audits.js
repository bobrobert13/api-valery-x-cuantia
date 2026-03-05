import moment from "moment";

const initAudit = async (Audit, audit, Products, Inventory, Logger, sensitive) => {
    try {
        const count = await Products.countDocuments({ SENSITIVE: true, ESTATUS: 'A' })
        if (!count) {
            throw [sensitive ? "ONLY_NO_SENSITIVE_PRODUCTS" : "ONLY_SENSITIVE_PRODUCTS", "SYSTEM_ERROR", sensitive ? JSON.stringify({ sensitiveProducts: count }) : JSON.stringify({ NoSensitiveProducts: count })]
        }
        audit = await Audit.create({ sensitive: sensitive, status: "PENDIENTE" });
        const products = await Products.find({ SENSITIVE: sensitive, ESTATUS: 'A' }, { _id: 0, updatedAt: 0, createdAt: 0, __v: 0 }).lean();
        const inventoryProducts = await Inventory.insertMany(products);
        Logger.log(`LOS PRODUCTOS ${sensitive ? "SENSIBLES" : "NO SENSIBLES"} QUE SE AUDITARAN SON LOS SIGUIENTES: ${inventoryProducts.map((item) => { return item.CODIGO_PRODUCTO; })}`);
        Logger.log(`EL SISTEMA HA INICIADO LA AUDITORIA ${audit.auditId}`)
        return
    } catch (err) {
        if (Array.isArray(err)) {
            throw err
        }
        throw ["INIT_AUDIT_ERROR", err.toString(), "UNKNOW_PARAMS"]
    }
}

const closeAudit = async (Audit, audit, Products, Inventory, Logger, sensitive) => {
    try {
        if (sensitive) {
            await Audit.updateOne({ auditId: audit.auditId, status: { $ne: ["COMPLETADA"] } }, { $set: { status: ["COMPLETADA"] } })
            Logger.log(`EL SISTEMA HA CERRADO LA AUDITORIA ${audit.auditId}`)
        } else {
            const systemDate = moment(new Date()).format('YYYY-MM-DD h:mm:ss a')
            const auditDate = moment(audit.createdAt).format('YYYY-MM-DD h:mm:ss a')

            if (systemDate.split(" ")[1].split(":")[0] != 0 && systemDate.split(" ")[0] == auditDate.split(" ")[0]) {
                Logger.warn("EL JOB HA INTENTADO CERRAR LA AUDITORIA A UNA HORA NO CORRESPONDIENTE AL CIERRE DEL DIA, SE HA DENEGADO LA OPERACIÓN")
                return
            }

            await Audit.updateOne({ auditId: audit.auditId, status: { $ne: ["COMPLETADA"] } }, { $set: { status: ["COMPLETADA"] } })
            Logger.log(`EL SISTEMA HA CERRADO LA AUDITORIA ${audit.auditId}`)
            await initAudit(Audit, audit, Products, Inventory, Logger, sensitive)
        }
        return
    } catch (err) {
        if (Array.isArray(err)) {
            throw err
        }
        throw ["CLOSE_AUDIT_ERROR", err.toString(), "UNKNOW_PARAMS"]
    }
}

export { initAudit, closeAudit }