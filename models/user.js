const mongoose = require('mongoose');

const UsersSchema = new mongoose.Schema({
	id: {
		type: Number,
		required: true,
	},
	first_name: {
		type: String,
		required: true,
	},
	last_name: {
		type: String,
		required: true,
	},
	birthday: {
		type: Date,
		required: true,
	}
});

const User = mongoose.model('Users',UsersSchema);

module.exports = User;