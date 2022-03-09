import mongoose from "mongoose";

const schema = new mongoose.Schema({
    change: {
        first_name: {type: String, required: true},
        from: {type: Number, required: true},
        to: {type: Number, required: true}
    },
    proof: {type: Image, required: true},
});


const ProofSchema = mongoose.model("Proof", schema);

export default ProofSchema;