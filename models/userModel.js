const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    userId: {type: Number ,unique: true},
    Balance: { type: Number ,default: 0},
    referrals: { type: [Number], default: [] },
    referredBy: { type: Number, default: null },
    isAdmin: {type: Boolean ,default: false},
    walletAddress: { type: String ,default: "" },
    wantToRecive: { type: Boolean ,default: false},
    phoneNumber: { type:String ,default: '' },
    hasSeenImage: { type: Boolean ,default: false },
    ticket: { type:Boolean ,default: false }
})

const User = mongoose.model('User', userSchema);

module.exports = User;