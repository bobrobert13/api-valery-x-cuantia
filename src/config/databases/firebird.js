import Firebird from "node-firebird"

let dbOptions = {
    host: process.env.FIREBIRD_HOST,
    port: 3050,
    database: process.env.FIREBIRD_DATABASE,
    user: process.env.FIREBIRD_USER,
    password: process.env.FIREBIRD_PASSWORD,
    lowercase_keys: false,
    role: null,
    pageSize: 4096,
    retryConnectionInterval: 1000000
}

let backupOptions = {
    ...dbOptions,
    manager: true
}

let fileOptions = {
    database: backupOptions.database,
    files: [
        {
            filename: '',
            sizefile: '0'
        }
    ]
}

let pool
export class FDB {

    constructor() {

        this.options = dbOptions
        this.connected = false
        this.connection = {}
        this.inTransaction = false
        this.transaction = {}
        this.transactionResults = []

    }

    start(sockets) {
        return new Promise((resolve, reject) => {
            pool = Firebird.pool(sockets, dbOptions)
            if (!pool.options.isPool) {
                reject(["FIREBIRD_POOL_START_ERROR", "UNKNOW_ERROR", JSON.stringify(dbOptions)])
                return
            }
            resolve("FIREBIRD_POOL_START_SUCCESFULL")
        })
    }

    connect() {
        return new Promise(async (resolve, reject) => {
            if (pool.dbinuse >= 5) {
                await pool.destroy()
                await this.detach()
                await this.start(200)
            }
            pool.get((err, db) => {
                if (err) {
                    reject(["FIREBIRD_CONNECTION_ERROR", err, JSON.stringify(dbOptions)])
                    return
                }
                this.connected = true
                this.connection = db
                resolve("FIREBIRD_CONNECTION_SUCCESFULL")
            })
        })

    }

    detach() {
        return new Promise((resolve, reject) => {
            try {
                if (this.connected) {
                    this.connection.detach()
                    this.connected = false
                }
                resolve("FIREBIRD_DETACH_DATABASE")
            } catch (err) {
                reject(["FIREBIRD_DETACH_ERROR", err, this.db])
            }
        })
    }

    query(sql) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(["NO_FIREBIRD_CONNECTION", JSON.stringify({ "NO_FIREBIRD_CONNECTION": true }), this.connected])
                return
            }
            this.connection.query(sql, (err, result) => {
                if (err) {
                    reject(["FIREBIRD_QUERY_ERROR", err, sql])
                    return
                }
                resolve(result)
            })
        })
    }

    execute(sql, params) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(["NO_FIREBIRD_CONNECTION", { "NO_FIREBIRD_CONNECTION": true }, this.connected])
                return
            }
            this.connection.execute(sql, params, (err, result) => {
                if (err) {
                    reject(["FIREBIRD_QUERY_ERROR", err, params[0]])
                    return
                }
                resolve(result)
            })
        })
    }

    buffer(blob) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(["NO_FIREBIRD_CONNECTION", { "NO_FIREBIRD_CONNECTION": true }, this.connected])
                return
            }
            blob(async (err, _, e) => {
                if (err) {
                    reject(["FIREBIRD_BLOB_ERROR", err, sql])
                    return
                }
                let Buffers = []
                e.on("data", chunk => {
                    Buffers.push(chunk);
                });
                await e.once("end", () => {
                    resolve(Buffer.concat(Buffers))
                })
            })
        })
    }

    startTransaction() {
        return new Promise((resolve, reject) => {
            this.connection.transaction(Firebird.ISOLATION_READ_COMMITED, function (err, transaction) {
                if (err) {
                    transaction.rollback()
                    reject(["FIREBIRD_TRANSACTION_INSTANCE_ERROR", err, this.db])
                    return
                }
                this.transaction = transaction
                this.inTransaction = true
                resolve(true)
            })
        })

    }

    queryTransaction(sql) {
        return new Promise((resolve, reject) => {
            if (!this.inTransaction) {
                reject(["NO_TRANSACTION_INSTANCE", { "NO_TRANSACTION_INSTANCE": true }, this.inTransaction])
                return
            }
            this.transaction.query(sql, (err, result) => {
                if (err) {
                    transaction.rollback()
                    this.transactionResults = []
                    this.inTransaction = false
                    this.transaction = {}
                    reject(["FIREBIRD_QUERY_ERROR", err, sql])
                    return
                }
                this.transactionResults.push(result)
                resolve(result)
            })
        })
    }

    executeTransaction(sql, params) {
        return new Promise((resolve, reject) => {
            if (!this.inTransaction) {
                reject(["NO_TRANSACTION_INSTANCE", { "NO_TRANSACTION_INSTANCE": true }, this.inTransaction])
                return
            }
            this.transaction.execute(sql, params, (err, result) => {
                if (err) {
                    this.transaction.rollback()
                    this.transactionResults = []
                    this.inTransaction = false
                    this.transaction = {}
                    reject(["FIREBIRD_QUERY_ERROR", err, sql])
                    return
                }
                this.transactionResults.push(result)
                resolve(result)
            })
        })
    }

    commitTransaction() {
        return new Promise((resolve, reject) => {
            if (!this.inTransaction) {
                reject(["NO_TRANSACTION_INSTANCE_COMMIT", { "NO_TRANSACTION_INSTANCE_COMMIT": true }, this.inTransaction])
                return
            }
            this.transaction.commit((err) => {
                const response = this.transactionResults
                this.transactionResults = []
                this.inTransaction = false
                if (err) {
                    this.transaction.rollback()
                    this.transaction = {}
                    reject(["TRANSACTION_COMMIT_ERROR", err, this.db])
                    return
                }
                this.transaction = {}
                resolve(response)
            })
        })
    }

    backup(path) {
        return new Promise((resolve, reject) => {
            fileOptions.files[0].filename = path
            Firebird.attach(backupOptions, (err, svc) => {
                if (err) {
                    reject(["FIREBIRD_CONNECT_BACKUP_ERROR", err, JSON.stringify(backupOptions)])
                    return
                }
                svc.backup(fileOptions, (err, data) => {
                    if (err) {
                        reject(["FIREBIRD_BACKUP_ERROR", err, JSON.stringify(fileOptions)])
                        return
                    }
                    data.on('data', (line) => {
                        reject(["FIREBIRD_BACKUP_ERROR", line, JSON.stringify(fileOptions)])
                        return
                    })
                    data.on('end', () => {
                        svc.detach()
                        resolve("SE HA RESPALDADO LA BASE DE DATOS CON EXITO EN: " + path)
                        return
                    })
                })

            })
        })
    }

    // destroy() {
    //     return new Promise((resolve, reject) => {
    //         pool.destroy()
    //         console.log(pool)
    //         if(pool){
    //             reject(["FIREBIRD_POOL_DESTROY_ERROR", "UNKNOW_ERROR", JSON.stringify(pool)])  
    //             return
    //         }
    //         resolve("FIREBIRD_POOL_DESTROY_SUCCESFULL")
    //     })
    // }

}
