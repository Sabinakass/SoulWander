const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  creationDate: { type: Date, default: Date.now },
  updateDate: Date,
  role: { type: String, enum: ['guest','user', 'admin'], default: 'guest' },
});

module.exports = mongoose.model('User', userSchema);
