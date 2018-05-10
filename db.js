const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const state = {
    mongoose: null,
};

exports.connect = function () {
    if (state.mongoose) return mongoose;
    mongoose.connect('mongodb://localhost/apartment_management');
    state.mongoose = mongoose;
    return mongoose;
}

exports.get = function () {
    return mongoose;
}