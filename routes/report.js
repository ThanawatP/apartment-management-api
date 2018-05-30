const express = require('express');
const router = express.Router();
const Rental = require('../models/rental.model');

router.post('/generate', function (req, res) {
    billPeriod = req.body["bill_period"];
    if (!billPeriod || billPeriod.trim() == "") {
        return res.status(400).send("Field bill period cannot be empty.");
    }
    Rental.model.find({
            "bill_period": billPeriod
        }).exec()
        .then(rentals => {
            if (rentals) {
                let paidTotal = 0;
                let pendingTotal = 0;
                let total = 0;
                let pendingRooms = [];

                for (let rental of rentals) {
                    if (rental.status == "paid") {
                        paidTotal += rental.total;
                    } else if (rental.status == "pending") {
                        pendingTotal += rental.total;
                        pendingRooms.push(rental.room_id);
                    }
                    total += rental.total;
                }
                let summary = {
                    "bill_period": billPeriod,
                    "paid": paidTotal,
                    "pending": pendingTotal,
                    "total": total,
                    "pending_rooms": pendingRooms
                };
                res.json(summary);
            } else {
                console.log(`Rental of bill period ${billPeriod} is not found.`);
                res.sendStatus(404);
            }
        })
        .catch(err => res.status(500).send(`Cannot get rentals of bill period ${billPeriod} because ${err}`));
});

module.exports = router;