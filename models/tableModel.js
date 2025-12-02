
const mongoose = require("mongoose")

const tableSchema = mongoose.Schema({
    tableNo: {
        type: String,
        require: true,
        unique: true,
    },
    status: {
        type: String,
        default: "avilable"
    },
    currentOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }
})
module.exports = mongoose.model('Table', tableSchema)