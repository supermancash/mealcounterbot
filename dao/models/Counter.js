import mongoose from "mongoose";

const schema = new mongoose.Schema({
    id: {type: String, required: true, unique: true, dropDups: true},
    first_name: {type: String, required: true},
    meals_owed: [{
        meal_receiver: {type: String, required: true},
        amount: {type: Number, required: true},
        bets: []
    }]
});

const CounterSchema = mongoose.model("Counter", schema);
export default CounterSchema;