const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order");
const Cart = require("./models/Cart");
const Review = require("./models/Review");


const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Connection error", err));


// Routes

// Get all products
app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Add a product
app.post("/products", async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

// Get all customers
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Create an order
app.post("/orders", async (req, res) => {
  const order = new Order(req.body);
  await order.save();
  res.json(order);
});

// Get all orders (with populated data)
app.get("/orders", async (req, res) => {
  const orders = await Order.find()
    .populate("customer")
    .populate("products.product");
  res.json(orders);
});

// Get single order
app.get("/orders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customer")
    .populate("products.product");
  res.json(order);
});

// DELETE product
app.delete("/products/:id", async (req, res) => {
  const result = await Product.findByIdAndDelete(req.params.id);
  res.json(result);
});

//Filter products 
app.get("/products/search/:category", async (req, res) => {
  const category = req.params.category;
  const products = await Product.find({ category: new RegExp(category, "i") });
  res.json(products);
});

//Create User
app.post("/users", async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.json(user);
});

//Search for a user
app.get("/users/search/:query", async (req, res) => {
  const query = req.params.query;
  const users = await User.find({
    $or: [
      { firstName: new RegExp(query, "i") },
      { lastName: new RegExp(query, "i") },
      { email: new RegExp(query, "i") }
    ]
  });
  res.json(users);
});

//Add to cart
app.post("/cart/:userId", async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity } = req.body;

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const existingItem = cart.items.find(item => item.product.equals(productId));
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  cart.updatedAt = new Date();
  await cart.save();
  res.json(cart);
});


//Create new order
app.post("/orders", async (req, res) => {
  const { customerId, productIds } = req.body;

  let totalAmount = 0;
  const orderProducts = [];

  for (const { productId, quantity } of productIds) {
    const product = await Product.findById(productId);
    if (product) {
      totalAmount += product.price * quantity;
      orderProducts.push({ product: product._id, quantity });
    }
  }

  const order = new Order({
    customer: customerId,
    products: orderProducts,
    totalAmount,
    orderDate: new Date(),
  });

  await order.save();
  res.json(order);
});

//Get user cart
app.get("/cart/:userId", async (req, res) => {
  const cart = await Cart.findOne({ user: req.params.userId }).populate("items.product");
  res.json(cart);
});

//Reviews
app.post("/products/:productId/reviews", async (req, res) => {
  const { productId } = req.params;
  const { userId, rating, comment } = req.body;

  const product = await Product.findById(productId);
  product.reviews.push({ userId, rating, comment });
  await product.save();
  res.json(product);
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
