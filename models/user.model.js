const db = require('../db');
const mongoose = db.get();

const User = mongoose.model('User', {
    _id: String,
    name: String, 
    birth_date: Date,
    room_id: String,
    created_at: Date,
    updated_at: Date
});

module.exports = User;