const db = require('../db');
const mongoose = db.get();

const Room = mongoose.model('Room', {
    _id: String,
    user: {
        id: String,
        name: String
    },
    rates: Number,
    electricity_previous_reading: Number,
    water_previous_reading: Number,
    created_at: Date,
    updated_at: Date
});

exports.update = function (roomId, userId, username, rates) {
    return Room.findById(roomId).exec()
        .then(room => {
            if (room.user) {
                if (userId) {
                    room.user.id = userId;
                }
                if (username) {
                    room.user.name = username;
                }
            } else {
                room.user = {
                    id: userId,
                    name: username
                };
            }
            if (rates) {
                room.rates = rates;
            }
            room.updated_at = new Date(Date.now()).toISOString();
            return room.save()
                .then(updatedRoom => Promise.resolve(updatedRoom))
                .catch(err => Promise.reject("Cannot update room id " + roomId + " because " + err));
        })
        .catch(err => Promise.reject("Cannot find room id " + roomId + " because " + err));
}

exports.removeUser = function (roomId) {
    return Room.findById(roomId).exec()
        .then(room => {
            room.user = {};
            room.updated_at = new Date(Date.now()).toISOString();
            return room.save()
                .then(updatedRoom => Promise.resolve(updatedRoom))
                .catch(err => Promise.reject("Cannot update room id " + roomId + " because " + err));
        })
        .catch(err => Promise.reject("Cannot find room id " + roomId + " because " + err));
}

exports.getAvailableRooms = function () {
    let query = {
        "user.id": null
    };
    return Room.find(query).exec()
        .then(rooms => {
            return Promise.resolve(rooms);
        })
        .catch(err => Promise.reject("Cannot find available rooms because " + err));
}

exports.resetReading = function () {
    return Room.find().exec()
        .then(rooms => {
            for (let room of rooms) {
                room.electricity_previous_reading = 0;
                room.water_previous_reading = 0;
                room.updated_at = new Date(Date.now()).toISOString();
                room.save()
                    .catch(err => {
                        return Promise.reject("Cannot update room id " + roomId + " because " + err);
                    });
            }
            return Promise.resolve(rooms);
        })
        .catch(err => Promise.reject());
}

exports.model = Room;