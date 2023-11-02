let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
	bank_name : {
		type: String,
		require: true
	},
	purpose : {
		type: String,
		require: true
	},
	card_type: {
		type: String,
		require: true
	},
	card_number: {
		type: String,
		require: true
	},
	card_holder: {
		type: String,
		require: true
	},
	expiry_date: {
		type: String,
		require: true
	},
	cvv: {
		type: String,
		require: true,
	},
    card_photo_front : {
        type: String,
		require: true
    },
    card_photo_back : {
        type: String,
		require: true
    },
	total_limit : {
		type: Number,
		require: true,
	},
	due_date_timestamp : {
		type: Number,
		require: true,
	},
    due_date : {
        type: String,
		require: true,
    },
    due_amount : {
        type: Number,
		require: true,
    },
	userid : {
		type: mongoose.Types.ObjectId,
		require : true
	},
	createdBy: {
		type: mongoose.Types.ObjectId,
		default: null
	},
	updatedBy: {
		type: mongoose.Types.ObjectId,
		default: null
	}
}, { timestamps: true, strict: false, autoIndex: true });
schema.plugin(mongoosePaginate);
module.exports = schema;