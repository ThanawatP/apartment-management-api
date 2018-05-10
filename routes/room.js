const express = require('express');
const router = express.Router();
const Room = require('../models/room.model');
const Rental = require('../models/rental.model');
const BillPeriod = require('../models/bill_period.model');
const util = require('util');

router.post('/reset', function (req, res) {
    Room.resetReading()
        .then(() => {
            BillPeriod.removeAll()
                .then(() => res.json("Reset reading all rooms finished"))
                .catch(err => {return res.status(500).send(err)});
        })
        .catch(err => res.status(500).send(err));
});

router.get('/:room_id', function (req, res) {
    let roomId = req.params["room_id"];
    Room.model.findById(roomId).exec(function (err, room) {
        if (err) return "error";
        if (room != null) {
            res.json(room);
        } else {
            let msg = "Room id: " + roomId + " is not found.";
            res.sendStatus(404);
        }
    });
});

router.post('/', function (req, res) {
    roomId = req.body["room_id"];
    rates = req.body["rates"];
    if (!roomId || roomId.trim() == "") {
        return res.status(400).send("Field room_id cannot be empty.");
    }

    if (!rates || rates.trim() == "") {
        return res.status(400).send("Field rates cannot be empty.");
    }

    timeNow = new Date(Date.now()).toISOString();
    const newRoom = new Room.model({
        _id: roomId,
        rates: rates,
        electricity_previous_reading: 0,
        water_previous_reading: 0,
        created_at: new Date(Date.now()).toISOString(),
        updated_at: new Date(Date.now()).toISOString()
    });
    newRoom.save(function (err, room) {
        if (err) return res.status(403).send("Cannot create room because " + err);
        res.json(room);
    });
});

router.post('/:room_id', function (req, res) {
    roomId = req.params["room_id"];
    userId = req.body["user_id"];
    username = req.body["username"];
    rates = req.body["rates"];
    if (!roomId || roomId.trim() == "") {
        return res.status(400).send("Field room_id cannot be empty.");
    }

    if (!rates || rates.trim() == "") {
        return res.status(400).send("Field rates cannot be empty.");
    }

    Room.update(roomId, userId, username, rates)
        .then(room => {
            res.json(room);
        })
        .catch(err => res.status(500).send(err));
});

module.exports = router;