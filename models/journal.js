const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user who created the journal entry
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    mood: { 
        type: String, 
        enum: ['Happy', 'Sad', 'Angry','Calm', 'Confused'], 
    }
});

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
