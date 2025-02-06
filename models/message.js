const mongoose = require("mongoose");

const msgSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  msg: {
    type: String,
    required: true, // Change this line

    maxLength: 100,
  },
});

const Msg = mongoose.model("Msg", msgSchema);

module.exports = Msg;
