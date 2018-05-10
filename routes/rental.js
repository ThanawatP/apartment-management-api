const express = require('express');
const router = express.Router();
const Rental = require('../models/rental.model');
const Room = require('../models/room.model');
const Rate = require('../models/rate.model');
const BillPeriod = require('../models/bill_period.model');
const db = require('../db');
const mongoose = db.get();
const dateFormat = require('dateformat');
const multer = require('multer');
const variable = require('variables');
const UPLOAD_PATH = variable.UPLOAD_PATH;
const PENDING = variable.PENDING;
const PAID = variable.PAID;
const cleanFolder = require('utils').cleanFolder;
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({
    storage: storage
});
const fs = require('fs');
const csv = require('fast-csv');

function generateThisYearBillPeriods() {
    const thisYear = new Date(Date.now()).getFullYear();
    let billPeriods = [];
    for (let i = 1; i <= 12; i++) {
        let period = `0${i}/${thisYear}`;
        if (i > 9) {
            period = `${i}/${thisYear}`;
        }
        billPeriods.push(period);
    }
    return billPeriods;
}

router.get('/list', async function (req, res) {
    let roomIDsParam = req.query["room_ids"];
    let startMonth = req.query["start_month"];
    let endMonth = req.query["end_month"];
    let annual = req.query["annual"];
    let billPeriod = req.query["bill_period"];
    let roomTerm = req.query["room_term"];
    let status = req.query["status"];
    let pageParam = req.query["page"] || 1;
    let limitParam = req.query["limit"] || 10;
    let page = +pageParam;
    let limit = +limitParam;
    let data = {
        data: [],
        count: 0,
        total: 0
    };

    let roomIDs = [];
    if (roomIDsParam) {
        roomIDs = roomIDsParam.split(',');
    }
    let query = {};
    if (roomIDs.length > 1) {
        query["room_id"] = {
            $in: roomIDs
        };
    } else if (roomIDs.length === 1) {
        query["room_id"] = roomIDs[0];
    }
    if (annual && annual == "true") {
        let billPeriods = generateThisYearBillPeriods();
        query["bill_period"] = {
            $in: billPeriods
        };
    } else if (startMonth) {
        return res.status(400).send("Missing field end_month");
    } else if (endMonth) {
        return res.status(400).send("Missing field start_month");
    } else if (billPeriod) {
        query["bill_period"] = billPeriod;
    } else {
        await BillPeriod.model.findOne().sort({
                date: -1
            }).exec()
            .then(billPeriod => query["bill_period"] = billPeriod.id)
            .catch(err => {
                return res.status(500).send("Cannot get latest bill period.");
            });
    }
    if (roomTerm) {
        query["room_id"] = {
            $regex: `${roomTerm}`
        };
    }
    if (status && status != "all") {
        query["status"] = status;
    }

    console.log(`query: ${JSON.stringify(query)}`);
    try {
        const [rentals, count] = await Promise.all([
            Rental.model.find(query).limit(limit).skip((limit * page) - limit).lean().exec(),
            Rental.model.count(query)
        ]);
        for (let rental of rentals) {
            console.log(`room id: ${rental.room_id} | user id: ${rental.user_id} | total: ${rental.total}`);
        }
        data = {
            data: rentals,
            count: rentals.length,
            total: count
        };
        res.json(data);
    } catch (err) {
        res.sendStatus(404).send(err);
    }
});

function getRates() {
    let rateMapping = {};
    let query = {
        _id: {
            $in: ["electricity", "water"]
        }
    };
    return Rate.model.find(query).exec()
        .then(rates => {
            for (let rate of rates) {
                rateMapping[rate["_id"]] = rate["value"];
            }
            return Promise.resolve(rateMapping);
        })
        .catch(err => {
            return Promise.reject(err);
        });
}

router.post('/', function (req, res) {
    roomID = req.body["room_id"];
    electricityRecentReading = req.body["electricity_recent_reading"];
    waterRecentReading = req.body["water_recent_reading"];

    if (!roomID) {
        return res.status(400).send("Field room_id cannot be empty.");
    }

    Room.model.findById(roomID).exec()
        .then(room => {
            if (room.user && room.user.id === "") {
                return res.status(500).send(`Cannot create rental of room id ${roomID} because nobody lives in this room`);
            }
            let createRental = async function () {
                let rateMapping;
                try {
                    rateMapping = await getRates();
                } catch (err) {
                    return err;
                }
                return Rental.createOne(
                    roomID,
                    room.user.id,
                    room.rates,
                    room.electricity_previous_reading,
                    room.water_previous_reading, +electricityRecentReading, +waterRecentReading,
                    rateMapping["electricity"],
                    rateMapping["water"],
                    dateFormat(new Date(Date.now()).toISOString(), "mm/yyyy")
                );
            }
            createRental()
                .then(newRental => {
                    newRental.save()
                        .then(rental => {
                            let body = {
                                "$set": {
                                    electricity_previous_reading: +electricityRecentReading,
                                    water_previous_reading: +waterRecentReading,
                                    updated_at: new Date(Date.now()).toISOString()
                                }
                            };
                            Room.model.findByIdAndUpdate(roomID, body).exec()
                                .then(() => console.log(`updated room id ${roomID}`))
                                .catch(err => console.log(err));
                            res.json(rental);
                        })
                        .catch(err => {
                            return res.status(403).send(`Cannot create rental of room id ${roomID} because ${err}`);
                        });
                })
                .catch(err => {
                    return res.status(500).send(err);
                });

        })
        .catch(err => {
            return res.status(500).send(`Cannot search room because ${err}`);
        })
});

function readCSV(filepath) {
    const stream = fs.createReadStream(filepath);
    let roomMapping = {};
    let roomIDs = [];
    return new Promise((resolve, reject) => {
        csv.fromStream(stream, {
                delimiter: ',',
                headers: ["room_id", "electricity", "water"]
            })
            .on("data", function (data) {
                roomMapping[data["room_id"]] = {
                    electricity: data["electricity"],
                    water: data["water"]
                };
                roomIDs.push(data["room_id"]);
            })
            .on("end", function () {
                cleanFolder(UPLOAD_PATH);
                stream.close();
                let data = {
                    "room_mapping": roomMapping,
                    "room_ids": roomIDs
                };
                return resolve(data);
            })
    });
}

function generateRentals(filepath, status) {
    return new Promise((resolve, reject) => {
        readCSV(filepath)
            .then(data => {
                let query = {
                    _id: {
                        $in: ["electricity", "water"]
                    }
                };
                let roomMapping = data["room_mapping"];
                let splitedFilepath = filepath.split("/");
                let filename;
                if (splitedFilepath.length == 2) {
                    filename = splitedFilepath[1].split(".csv")[0];
                } else {
                    filename = splitedFilepath[2].split(".csv")[0];
                }
                let splitedFilename = filename.split("_");
                let month = splitedFilename[0];
                let year = splitedFilename[1];
                Rate.model.find(query).exec()
                    .then(rates => {
                        let rateMapping = {};
                        for (let rate of rates) {
                            rateMapping[rate["_id"]] = rate["value"];
                        }
                        query = {
                            "_id": {
                                $in: data["room_ids"]
                            }
                        };
                        Room.model.find(query).exec()
                            .then(rooms => {
                                const billPeriod = dateFormat(new Date(+year, +month - 1), "mm/yyyy");
                                let rentals = [];
                                for (let room of rooms) {
                                    let roomID = room["_id"];
                                    let rental = Rental.createOne(
                                        roomID,
                                        room["user"]["id"], +room["rates"], +room["electricity_previous_reading"], +room["water_previous_reading"], +roomMapping[roomID]["electricity"], +roomMapping[roomID]["water"],
                                        rateMapping["electricity"],
                                        rateMapping["water"],
                                        billPeriod,
                                        status
                                    );
                                    rentals.push(rental);
                                }
                                const billPeriodData = new BillPeriod.model({
                                    _id: billPeriod,
                                    date: new Date(+year, +month - 1, 1).toISOString(),
                                    created_at: new Date(Date.now()).toISOString()
                                });
                                BillPeriod.model.create(billPeriodData)
                                    .then(() => {
                                        console.log(`finish create bill period ${billPeriod}`);
                                        Rental.model.insertMany(rentals)
                                            .then(() => {
                                                for (let room of rooms) {
                                                    let roomID = room["_id"];
                                                    let body = {
                                                        "$set": {
                                                            "electricity_previous_reading": +roomMapping[roomID]["electricity"],
                                                            "water_previous_reading": +roomMapping[roomID]["water"],
                                                            "updated_at": new Date(Date.now()).toISOString(),
                                                        }
                                                    };
                                                    Room.model.findByIdAndUpdate(roomID, body).exec()
                                                        .then(() => console.log(`updated room id ${roomID}`))
                                                        .catch(err => console.log(err));
                                                }
                                                const data = {
                                                    count: rentals.length,
                                                    data: rentals
                                                };
                                                resolve(data);
                                            })
                                            .catch(err => reject(`Cannot create rentals because ${err}`));
                                    }).catch(err => reject(`Cannot create bill period because ${err}`));
                            })
                            .catch(err => reject(`Cannot search rooms because ${err}`));
                    })
                    .catch(err => reject(`Cannot get rates because ${err}`));
            })
            .catch(err => {
                console.log(`err: ${err}`);
                reject(err);
            });
    });
}

router.post('/upload', upload.single('data'), function (req, res, next) {
    generateRentals(`${UPLOAD_PATH}/${req.file.originalname}`, PENDING)
        .then(data => res.json(data))
        .catch(err => res.status(500).send(err));
});

router.post('/example', async function (req, res) {
    await generateRentals(`./12_2017.csv`, PAID);
    await generateRentals(`./01_2018.csv`, PAID);
    await generateRentals(`./02_2018.csv`, PAID);
    await generateRentals(`./03_2018.csv`, PAID);
    await generateRentals(`./04_2018.csv`, PENDING);
    res.json("example generated");
});

router.get('/:id', function (req, res) {
    id = req.params["id"];
    Rental.model.findById(id).exec()
        .then(rental => {
            if (rental) {
                res.json(rental);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(err => res.status(500).send(`Cannot get rental id ${id} because ${err}`));
});

router.post('/:id', function (req, res) {
    id = req.params["id"];
    Rental.model.findById(id).exec()
        .then(rental => {
            if (rental) {
                rental.status = PAID;
                rental.updated_at = new Date(Date.now()).toISOString();
                rental.save()
                    .then(updatedRental => res.json(updatedRental))
                    .catch(err => {
                        return res.status(403).send(`Cannot update rental id ${id} because ${err}`);
                    });
            } else {
                res.sendStatus(404);
            }
        })
        .catch(err => res.status(500).send(`Cannot get rental id ${id} because ${err}`));
});

module.exports = router;