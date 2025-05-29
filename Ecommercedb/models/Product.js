const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  inventory: Number,
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rating: Number,
      comment: String,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});


module.exports = mongoose.model("Product", ProductSchema);
