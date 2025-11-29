import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },

        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        solvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    { timestamps: true }
);

export default mongoose.model("Item", itemSchema);
