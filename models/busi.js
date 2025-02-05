const mongoose = require("mongoose");

const busiSchema = new mongoose.Schema({
  businame: {
    type: String,
    required: true,
  },
  busitype: {
    type: String,
    required: true,
  },
  busidescri: {
    type: String,
    maxLength: 70,
  },
  created_at: {
    type: Date,
    required: true,
  },
});

const Busi = mongoose.model("Busi", busiSchema);

module.exports = Busi;
