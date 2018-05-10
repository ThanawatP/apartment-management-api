const express = require('express');
const router = express.Router();
const Rate = require('../models/rate.model');

router.get('/:id', function (req, res) {
    id = req.params["id"];
    Rate.model.findById(id).exec()
        .then(rate => {
            if (rate) {
                res.json(rate);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(err => res.status(500).send(`Cannot get rate id ${id} because ${err}`));
});

router.post('/:id', function (req, res) {
    id = req.params["id"];
    value = req.body["value"];
    if (!value || value.trim() == "") {
        return res.status(400).send("Field value cannot be empty.");
    }
    let timenow = new Date(Date.now()).toISOString();
    let body = {
        "$set": {
            value: +value,
            updated_at: timenow
        }
    };
    Rate.model.findByIdAndUpdate(id, body).exec()
        .then(rate => {
            rate.value = +value;
            rate.updated_at = timenow;
            res.json(rate);
        })
        .catch(err => {
            return res.status(500).send(`Cannot update rate id ${id} because ${err}`);
        });
});

module.exports = router;