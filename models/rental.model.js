const db = require('../db');
const mongoose = db.get();

const Rental = mongoose.model('Rental', {
	room_id: String,
	user_id: String,
	electricity_bill: {
		previous_reading: Number,
		recent_reading: Number,
		consumption: Number,
		rate: Number,
		cost: Number,
	},
	water_bill: {
		previous_reading: Number,
		recent_reading: Number,
		consumption: Number,
		rate: Number,
		cost: Number
	},
	rate: Number,
	total: Number,
	status: String,
	bill_period: String,
	created_at: Date,
	updated_at: Date
});

function calculateConsumption(recentReading, previousReading) {
	return recentReading - previousReading;
}

function calculateCost(consumption, rate) {
	return consumption * rate;
}

function calculateTotal(roomRate, electricityCost, waterCost) {
	return roomRate + electricityCost + waterCost;
}

const createOne = function (
	roomID,
	userID,
	roomRate,
	electricityPreviousReading,
	waterPreviousReading,
	electricityRecentReading,
	waterRecentReading,
	electricityRate,
	waterRate,
	billPeriod,
	status
) {
	// electricity
	let electricityConsumption = calculateConsumption(electricityRecentReading, electricityPreviousReading);
	let electricityCost = calculateCost(electricityConsumption, electricityRate);
	// console.log(`${electricityRecentReading} | ${electricityPreviousReading} = ${electricityConsumption} = ${electricityCost}`)

	// water
	let waterConsumption = calculateConsumption(waterRecentReading, waterPreviousReading);
	let waterCost = calculateCost(waterConsumption, waterRate);
	// console.log(`${waterRecentReading} | ${waterPreviousReading} = ${waterConsumption} = ${waterCost}`)

	let total = calculateTotal(roomRate, electricityCost, waterCost);
	// console.log(`total: ${total}`)
	let timenow = new Date(Date.now()).toISOString();
	let rental = new Rental({
		_id: mongoose.Types.ObjectId(),
		room_id: roomID,
		user_id: userID,
		electricity_bill: {
			previous_reading: electricityPreviousReading,
			recent_reading: electricityRecentReading,
			consumption: electricityConsumption,
			rate: electricityRate,
			cost: electricityCost,
		},
		water_bill: {
			previous_reading: waterPreviousReading,
			recent_reading: waterRecentReading,
			consumption: waterConsumption,
			rate: waterRate,
			cost: waterCost
		},
		rate: roomRate,
		total: total,
		status: status,
		bill_period: billPeriod,
		created_at: timenow,
		updated_at: timenow
	});
	return rental;
}

exports.createOne = createOne;

exports.model = Rental;