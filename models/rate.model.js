const db = require('../db');
const mongoose = db.get();

const Rate = mongoose.model('Rate', {
    _id: String,
    value: Number,
    created_at: Date,
    updated_at: Date
});

exports.model = Rate;