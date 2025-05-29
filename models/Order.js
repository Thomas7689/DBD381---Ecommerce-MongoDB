const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number
    }
  ],
  totalAmount: Number,
  orderDate: { type: Date, default: Date.now },
  paymentStatus: { type: String, default: "Pending" } 
});


module.exports = mongoose.model("Order", OrderSchema);