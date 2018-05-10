const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Room = require('../models/room.model');

const ID_LENGTH = 13;

router.get('/:user_id', function (req, res) {
    let userId = req.params["user_id"];
    User.findById(userId).exec(function (err, user) {
        if (err) return "error";
        if (user != null) {
            res.json(user);
        } else {
            let msg = "User id: " + userId + " is not found.";
            res.sendStatus(404);
        }
    });
});

router.post('/', function (req, res) {
    let userId = req.body["user_id"];
    let username = req.body["username"];
    let birthDate = req.body["birth_date"];
    let roomId = req.body["room_id"];

    if (!userId) {
        return res.status(400).send("Field user_id cannot be empty.");
    }

    if (userId.length != ID_LENGTH) {
        return res.status(400).send("Id " + userId + " is wrong format.");
    }

    let timeNow = new Date(Date.now()).toISOString();
    const newUser = new User({
        _id: userId,
        name: username,
        // birth_date: new Date(birthDate).toISOString(),
        created_at: timeNow,
        updated_at: timeNow
    });
    if (birthDate) {
        newUser.birth_date = new Date(birthDate).toISOString();
    }
    if (roomId != "") {
        newUser.room_id = roomId;
    }

    newUser.save()
        .then(user => {
            if (roomId != "") {
                Room.update(roomId, user.id, user.name, "")
                    .then(room => console.log("room id " + roomId + " is updated."))
                    .catch(err => console.log("Cannot update user to room id " + roomId + " because " + err));
            }
            res.json(user);
        })
        .catch(err => res.status(403).send("Cannot create user becaues " + err));
});

router.post('/:user_id', function (req, res) {
    let userId = req.params["user_id"];
    let newUserId = req.body["user_id"];
    let username = req.body["username"];
    let birthDate = req.body["birth_date"];
    let roomId = req.body["room_id"];
    if (!userId) {
        return res.status(400).send("Field user_id cannot be empty.");
    }

    if (userId.length != ID_LENGTH) {
        return res.status(400).send("Id " + userId + " is wrong format.");
    }

    User.findById(userId).exec()
        .then(user => {
            let isChanged = false;
            let isRoomChanged = false;
            const lastRoomId = user.room_id;
            if (newUserId && newUserId.trim() != "" && user.id != newUserId.trim()) {
                user.id = newUserId.trim();
                isChanged = true;
            }
            if (username && username.trim() != "" && user.name != username.trim()) {
                user.name = username.trim();
                isChanged = true;
            }
            if (birthDate) {
                user.birth_date = new Date(birthDate).toISOString();
                isChanged = true;
            }
            if (roomId || (user.room_id != roomId.trim())) {
                user.room_id = roomId.trim();
                isChanged = true;
                isRoomChanged = true;
            }
            if (isChanged) {
                user.updated_at = new Date(Date.now()).toISOString();
                user.save()
                    .then(updatedUser => {
                        if (isRoomChanged) {
                            if (lastRoomId) {
                                Room.removeUser(lastRoomId)
                                    .catch(err => console.log("Cannot remove user from room id " + roomId + " because " + err));
                            }
                            if (roomId) {
                                Room.update(roomId.trim(), updatedUser.id, updatedUser.name, "")
                                    .then(room => console.log("room id " + roomId + " is updated."))
                                    .catch(err => console.log("Cannot update user to room id " + roomId + " because " + err));
                            }
                        }
                        res.json(updatedUser);
                    })
                    .catch(err => res.status(403).send("Cannot create user becaues " + err));
            }
        });
});

module.exports = router;