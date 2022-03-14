import mongoose from "mongoose";

const schema = new mongoose.Schema({
    id: {type: String, required: true, unique: true},
    is_bot: {type: Boolean, required: true},
    first_name: {type: String, required: true},
    username: {type: String, required: false},
    type: {type: String, required: false}
});


const UserSchema = mongoose.model("User", schema);

export default UserSchema;