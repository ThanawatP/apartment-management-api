const db = require('../db');
const mongoose = db.get();

const BillPeriod = mongoose.model('bill_period', {
    _id: String,
    date: Date,
    created_at: Date
});

const removeAll = function() {
    console.log("removing all bill periods");
    return BillPeriod.remove({}).exec()
        .then(() => Promise.resolve(`Remove all bill periods`))
        .catch(err => Promise.reject(`Cannot remove all bill period because ${err}`));
}

exports.removeAll = removeAll;

exports.model = BillPeriod;