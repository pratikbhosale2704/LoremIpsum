const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Create User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
  }
  next();
});

// Create User Model
const User = mongoose.model("User", userSchema);

module.exports = User;
