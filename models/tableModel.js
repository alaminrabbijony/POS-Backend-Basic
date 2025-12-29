
const mongoose = require("mongoose")

const tableSchema = mongoose.Schema({
    tableNo: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ["Available", "Booked"],
        default: "Available"
    },
    seats: {
        type: String,
        required: true
    },
    currentOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }
})
module.exports = mongoose.model('Table', tableSchema)