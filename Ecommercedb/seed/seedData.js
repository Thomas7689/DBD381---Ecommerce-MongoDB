const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const faker = require("faker");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Review = require("../models/Review");

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Review.deleteMany({});

    // Seed Users
    const users = [];
    for (let i = 0; i < 10; i++) {
      users.push(
        new User({
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          email: faker.internet.email(),
          password: faker.internet.password(10),
          role: i === 0 ? "admin" : "customer",
          address: {
            city: faker.address.city(),
            zip: faker.address.zipCode()
          }
        })
      );
    }
    const userDocs = await User.insertMany(users);
    console.log("Inserted users");

    // Seed Products with embedded reviews
    const products = [];
    for (let i = 0; i < 10; i++) {
      const reviewers = faker.helpers.shuffle(userDocs).slice(0, 2);
      const reviews = reviewers.map((user) => ({
        userId: user._id,
        rating: faker.datatype.number({ min: 3, max: 5 }),
        comment: faker.lorem.sentence()
      }));

      products.push(
        new Product({
          productId: `P${1000 + i}`,
          name: faker.commerce.productName(),
          category: faker.commerce.department(),
          price: parseFloat(faker.commerce.price()),
          inventory: faker.datatype.number({ min: 10, max: 200 }),
          reviews
        })
      );
    }
    const productDocs = await Product.insertMany(products);
    console.log("Inserted products with embedded reviews");

    // Seed Orders
    const orders = [];
    for (let i = 0; i < 5; i++) {
      const customer = faker.random.arrayElement(userDocs);
      const items = faker.helpers.shuffle(productDocs).slice(0, 2).map((product) => {
        const quantity = faker.datatype.number({ min: 1, max: 3 });
        return { product: product._id, quantity };
      });

      const total = items.reduce((sum, item) => {
        const prod = productDocs.find(p => p._id.equals(item.product));
        return sum + (prod.price * item.quantity);
      }, 0);

      orders.push(
        new Order({
          orderId: `O${789 + i}`,
          customer: customer._id,
          products: items,
          totalAmount: total.toFixed(2),
          paymentStatus: faker.helpers.randomize(["Paid", "Pending"]),
          orderDate: faker.date.recent()
        })
      );
    }
    const orderDocs = await Order.insertMany(orders);
    console.log("Inserted orders");

    // Seed Carts
    const carts = [];
    for (let i = 0; i < 5; i++) {
      const user = faker.random.arrayElement(userDocs);
      const items = faker.helpers.shuffle(productDocs).slice(0, 3).map(product => ({
        product: product._id,
        quantity: faker.datatype.number({ min: 1, max: 4 })
      }));

      carts.push(
        new Cart({
          user: user._id,
          items
        })
      );
    }
    const cartDocs = await Cart.insertMany(carts);
    console.log("Inserted carts");

    // Seed Review Collection (separate)
    const centralReviews = [];
    for (let i = 0; i < 10; i++) {
      const product = faker.random.arrayElement(productDocs);
      const user = faker.random.arrayElement(userDocs);

      centralReviews.push(
        new Review({
          product: product._id,
          user: user._id,
          rating: faker.datatype.number({ min: 3, max: 5 }),
          comment: faker.lorem.sentences(),
          createdAt: faker.date.past()
        })
      );
    }
    const reviewDocs = await Review.insertMany(centralReviews);
    console.log("Inserted reviews to central collection");

    // Export to JSON files
    const exportDir = path.join(__dirname, "../export");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    fs.writeFileSync(path.join(exportDir, "users.json"), JSON.stringify(userDocs, null, 2));
    fs.writeFileSync(path.join(exportDir, "products.json"), JSON.stringify(productDocs, null, 2));
    fs.writeFileSync(path.join(exportDir, "orders.json"), JSON.stringify(orderDocs, null, 2));
    fs.writeFileSync(path.join(exportDir, "carts.json"), JSON.stringify(cartDocs, null, 2));
    fs.writeFileSync(path.join(exportDir, "reviews.json"), JSON.stringify(reviewDocs, null, 2));

    console.log("Exported seeded data to /export folder");

    mongoose.disconnect();
    console.log("Database seeding complete!");
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

seedDatabase();
