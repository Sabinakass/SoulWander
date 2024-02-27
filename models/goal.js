const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Physical Health', 'Mental Health', 'Emotional Well-being', 'Social Connection'],
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    daysToAccomplish: {
      type: Number,
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  });
  

  module.exports = mongoose.model('Goal', goalSchema);
