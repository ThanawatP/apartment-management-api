const express = require('express');
const router = express.Router();
const User = require('../models/user.model');

router.get('/', async function (req, res) {
    let roomTerm = req.query["room_term"];
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
    if (roomTerm) {
        query["room_id"] = {
            $regex: `${roomTerm}`
        };
    }
    try {
        const [users, count] = await Promise.all([
            User.find(query).limit(limit).skip((limit * page) - limit).lean().exec(),
            User.count(query)
        ]);
        data = {
            data: users,
            count: users.length,
            total: count
        };
        res.json(data);
    } catch (err) {
        res.sendStatus(404).json(data);
    }
});

module.exports = router;