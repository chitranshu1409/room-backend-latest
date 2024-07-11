const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    roomId:{
        type :Number,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    }
})

const Users = mongoose.model('users', UserSchema);
module.exports=Users;