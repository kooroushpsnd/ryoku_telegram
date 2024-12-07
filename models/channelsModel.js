const mongoose = require("mongoose")

const channelSchema = new mongoose.Schema({
    name: [{type: String}]
})

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;