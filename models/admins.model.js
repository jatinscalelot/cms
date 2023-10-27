let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
	fname : {
		type: String,
		require: true
	},
	lname : {
		type: String,
		require: true
	},
	email: {
		type: String,
		require: true
	},
	mobile: {
		type: String,
		require: true
	},
	password: {
		type: String,
		default: ''
	},
    channelID : {
		type: String,
		require: false,
		default : ''
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