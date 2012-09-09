var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Guest = new Schema({
    email: {
      type: String,
      required: true,
    },
    gt_id: {
      type: String,
      require: true,
    }
});


var User = new Schema({
    name: {
        first: {
            type: String,
            required: true,
        },
        last: {
            type: String,
            required: true,
        },
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    additional_email: [{
        type: String,
        unique: true,
        required: false,
    }],
    is_admin: Boolean,
    gt_id: {
        type: String,
        unique: true,
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

    following: [{
        type: ObjectId,
        ref: 'Event',
    }],
});

var Org = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    admins: [{
        type: ObjectId,
        ref: 'User',
    }],
    description: String,
    slug: {
        type: String,
        required: true,
        unique: true,
    },
});

var Event = new Schema({
    title: String,
    org: {
        type: ObjectId,
        ref: 'Org',
    },
    start_time: {
        type: Date,
        required: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    attendees: [{
        type: ObjectId,
        ref: 'User',
    }],
    description: String,
    passkey: String,
    place: {
        type: ObjectId,
        ref: 'Place',
    },
});

var Place = new Schema({
    name: {
        type: String,
        required: true,
    },
    building: String,
});

var Participation = new Schema({
    event: {
      type:ObjectId,
      ref: 'Event',
      require:true,
    },
    account: {
      type:ObjectId,
      ref: 'User',
    },
    date: {
      type:Date,
      required: true,
    }
});

module.exports = {
    User: mongoose.model('User', User),
    Org: mongoose.model('Org', Org),
    Event: mongoose.model('Event', Event),
    Place: mongoose.model('Place', Place),
    Part: mongoose.model('Part', Participation),
    Guest: mongoose.model('Guest', Guest),
};
