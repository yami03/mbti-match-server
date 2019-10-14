const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    mbti: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    /*location: [
      {
        latitude: {
          type: Number,
          required: true
        },
        longitude: {
          type: Number,
          required: true
        }
      }
    ],
    profile_image: {
      type: String,
      required: true
    },
    dob: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },*/
    mail_confirm: {
      type: Boolean,
      default: false
    },
    dislike_users: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ],
    like_me: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ],
    chats: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: { createdAt: 'created_at' }
  }
);

module.exports = mongoose.model('User', userSchema);
