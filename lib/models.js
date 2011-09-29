var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var User = new Schema({
    name: {
        first: String,
        last: String,
    },
    email: {
        type: String,
        required: true,
    },
    is_admin: Boolean,
    gt_id: {
        type: String,
        required: true,
    },
    gt_userid: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },

    following: [ObjectId],
});

var Org = new Schema({
    name: {
        type: String,
        required: true,
    },
    admins: [ObjectId],
    description: String,
    slug: {
        type: String,
        required: true,
    },
});

var Event = new Schema({
    title: String,
    org: ObjectId,
    start_time: {
        type: Date,
        required: true,
    },
    stop_time: Date,
    attendees: [ObjectId],
    description: String,
    passkey: String,
    place: ObjectId,
});

var Place = new Schema({
    name: {
        type: String,
        required: true,
    },
    building: String,
});

mongoose.model('User', User);
mongoose.model('Org', Org);
mongoose.model('Event', Event);
mongoose.model('Place', Place);
