import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: { 
        type: String, 
        required: true 
    },
    role: {
        type: String,
        enum: ["StandartUsers", "Executives", "Authorities"],
        default: "StandartUsers"
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

async function cascadeDeleteUserLists(user) {
    if (!user?._id) return;

    try {
        const ShoppingList = mongoose.model("ShoppingList");
        const lists = await ShoppingList.find({ owner: user._id });

        for (const list of lists) {
            await list.deleteOne(); 
        }

        console.log(`[Cascade Delete] Deleted ${lists.length} lists owned by user ${user._id}.`);
    } catch (err) {
        console.error("Error during cascade delete (user → lists):", err);
    }
}

userSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    try {
        await cascadeDeleteUserLists(this);
        next();
    } catch (err) {
        console.error("Error in user.deleteOne cascade:", err);
        next(err);
    }
});

userSchema.pre("findOneAndDelete", async function (next) {
    try {
        const doc = await this.model.findOne(this.getFilter());
        if (doc) {
            await cascadeDeleteUserLists(doc);
        }
        next();
    } catch (err) {
        console.error("Error in user.findOneAndDelete cascade:", err);
        next(err);
    }
});

export default mongoose.model("User", userSchema);
