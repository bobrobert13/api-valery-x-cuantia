import mongoose from 'mongoose'

const statusEnum = ['awaiting', 'success', 'failed']

const userSchema = {
    fullName: {
        type: String,
        required: true
    },
    dni: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
}

const alterproductSchema = {
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
}

const productSchema = {
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    salePrice: {
        type: Number,
        required: true
    },
    ref: {
        type: String,
        required: true
    },
    alterproduct: {
        type: alterproductSchema
    }
}

const presupuestoSchema = {
    presupuestado: {
        type: Boolean
    },
    correlativo: {
        type: Number
    },
    documento: {
        type: String,
    },
    status: { 
        type: String,
        enum: statusEnum
    }
}

const pedidoSchema = {
    pedidoNumber: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true
    },
    totalProductos: {
        type: Number,
        required: true
    },
    products: {
        type: [productSchema],
        required: true
    }
}

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: Number,
        unique: true,
        required: true
    },
    user: {
        type: [userSchema],
        required: true
    },
    price: {
        type: String,
        required: true
    },
    pedido: {
        type: [pedidoSchema],
        required: true
    },
    presupuesto: {
        type: presupuestoSchema
    }
}, { timestamps: true })

const Orders = mongoose.model("orders", orderSchema)

export { Orders }