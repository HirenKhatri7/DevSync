const mongoose = require('mongoose');

const yjsDocumentSchema = new mongoose.Schema({
  docName: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  state: {
    type: Buffer,
    default: Buffer.alloc(0),
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('YjsDocument', yjsDocumentSchema);
