const express = require('express');
const router = express.Router();
const BillPeriod = require('../models/bill_period.model');

router.get('/all', function (req, res) {
    BillPeriod.model.find().sort({
            date: -1
        }).exec()
        .then(billPeriods => {
            if (billPeriods) {
                res.json(billPeriods);
            } else {
                let msg = 'Bill periods are not found.';
                res.sendStatus(404).send(msg);
            }
        })
        .catch(err => res.status(500).send(`Cannot get bill periods because ${err}`));
});

module.exports = router;