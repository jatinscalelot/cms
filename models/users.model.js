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
		require: true
	},
	my_referer_code: {
		type: String,
		require: true
	},
	referer_code: {
		type: String,
		require: false,
		default : ''
	},
	profile_photo : {
		type: String,
		require: false,
		default : ''
	},
	aadhar_card : {
		type: String,
		require: true
	},
	pan_card : {
		type: String,
		require: true
	},
	cheque : {
		type: String,
		require: true
	},
	is_approved: {
		type: Boolean,
		default: false
	},
	fcm_token : {
		type: String,
		require: false,
		default : ''
	},
	channelID : {
		type: String,
		require: false,
		default : ''
	},
	adminid : {
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