const express = require('express');
const router = express.Router();
const Room = require('../models/room.model');

router.get('/', async function (req, res) {
    let term = req.query["term"];
    let pageParam = req.query["page"] || 1;
    let limitParam = req.query["limit"] || 10;
    let page = +pageParam;
    let limit = +limitParam;
    let data = {
        data: [],
        count: 0,
        total: 0
    };
    let query = {};
    if (term) {
        query["_id"] = {
            $regex: `${term}`
        };
    }
    console.log(`query: ${JSON.stringify(query)}`);
    try {
        const [rooms, count] = await Promise.all([
            Room.model.find(query).limit(limit).skip((limit * page) - limit).lean().exec(),
            Room.model.count(query)
        ]);
        data = {
            data: rooms,
            count: rooms.length,
            total: count
        };
        res.json(data);
    } catch (err) {
        console.log(`err: ${err}`);
        res.sendStatus(404).send(err);
    }
});

router.get('/all', async function (req, res) {
    let term = req.query["term"];
    let query = {};
    if (term) {
        query["_id"] = {
            $regex: `${term}`
        };
    }
    console.log(`query: ${JSON.stringify(query)}`);
    Room.model.find(query).exec(function (err, rooms) {
        if (err) return "error";
        if (rooms != null) {
            for (let room of rooms) {
                console.log("id: " + room.id + " | room id: " + room.user.id);
            }
            res.json(rooms);
        } else {
            res.sendStatus(404).json([]);
        }
    });
});

router.get('/available', function (req, res) {
    Room.getAvailableRooms()
        .then(rooms => res.json(rooms))
        .catch(err => res.status(500).send(err));
})

module.exports = router;