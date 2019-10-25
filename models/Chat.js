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
        type: String
      },
      speaker: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      createAt: {
        type: Date,
        default: Date.now
      },
      isRead: false
    }
  ]
});

module.exports = mongoose.model('Chat', chatSchema);
