import mongoose from "mongoose";

const shoppingListSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        isArchived: { type: Boolean, default: false },

        items: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Item"
            }
        ],

        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    { timestamps: true }
);

async function cascadeDeleteListItems(list) {
    const Item = mongoose.model("Item");
    if (list.items && list.items.length > 0) {
        const result = await Item.deleteMany({ _id: { $in: list.items } });
        console.log(`[Cascade Delete] Deleted ${result.deletedCount} items of list ${list._id}.`);
    }
}

shoppingListSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    try {
        await cascadeDeleteListItems(this);
        next();
    } catch (err) {
        console.error("Error during cascade delete (list → items):", err);
        next(err);
    }
});


shoppingListSchema.pre("findOneAndDelete", async function (next) {
    try {
        const doc = await this.model.findOne(this.getFilter());
        if (doc) {
            await cascadeDeleteListItems(doc);
        }
        next();
    } catch (err) {
        console.error("Error during cascade delete (findOneAndDelete list → items):", err);
        next(err);
    }
});

export default mongoose.model("ShoppingList", shoppingListSchema);
