import mongoose from "mongoose";

const schema = new mongoose.Schema({
    first_name: {type: String, required: true},
    meals_owed: {type: Number, required: true},
});


const CounterSchema = mongoose.model("Counter", schema);

export default CounterSchema;