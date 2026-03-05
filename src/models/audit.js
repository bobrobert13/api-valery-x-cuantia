import mongoose from 'mongoose'
const statuses = ["PENDIENTE", "COMPLETADA"]

const auditSchema = new mongoose.Schema({
    status: {
        type: statuses,
        default: "PENDIENTE"
    },
    sensitive: {
        type: Boolean,
        default: false
    },
    auditId: String,
    user: {
        type: String,
        default: "SYSTEM"
    }
}, { timestamps: true })

auditSchema.pre('validate', async function (next) {
    let auditNumberPrefix
    let lastAuditNumber
    const auditNumberDigitCount = 5;

    !!this.sensitive ? await (async () => {
        auditNumberPrefix = 'A-S-';
        lastAuditNumber = await Audit.findOne({ sensitive: true }).sort({ updatedAt: -1 }).lean()
    })() : await (async () => {
        auditNumberPrefix = 'A-NS-';
        lastAuditNumber = await Audit.findOne({ sensitive: false }).sort({ updatedAt: -1 }).lean()
    })()

    !!lastAuditNumber ?
        (() => {
            const lastAuditNumberValue = lastAuditNumber.auditId.substring(auditNumberPrefix.length);
            const nextAuditNumberValue = parseInt(lastAuditNumberValue) + 1;
            const nextAuditNumberSuffix = ('0'.repeat(auditNumberDigitCount) + nextAuditNumberValue).slice(-auditNumberDigitCount);
            this.auditId = `${auditNumberPrefix}${nextAuditNumberSuffix}`;
        })() : this.auditId = `${auditNumberPrefix}${'0'.repeat(auditNumberDigitCount)}`

    next();
});

const Audit = mongoose.model("audit", auditSchema);

export { Audit }