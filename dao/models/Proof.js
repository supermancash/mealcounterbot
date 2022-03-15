import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        trade: {
            meal_ower: {type: String, required: true},
            meal_receiver: {type: String, required: true},
        },
        proof_img_url: {type: String, required: true}
    },
    {
        timestamps: true
    }
);


const ProofSchema = mongoose.model("Proof", schema);

export default ProofSchema;