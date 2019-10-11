const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  users: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    }
  ],
  messages: [
    {
      content: {
        type: String,
        required: true
      },
      speaker: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
      },
      createAt: {
        type: Date,
        default: Date.now,
        required: true
      }
    }
  ]
});

module.exports = mongoose.model('Chat', chatSchema);
