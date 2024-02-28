const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    pictureUrls: {
        type: [String],
        required: true
    },
    names: [{
        language: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        }
    }],
    descriptions: [{
        language: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        }
    }],
    timestamps: {
        created: {
            type: Date,
            default: Date.now,
            required: true
        },
        updated: {
            type: Date
        },
        deleted: {
            type: Date
        }
    }
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
