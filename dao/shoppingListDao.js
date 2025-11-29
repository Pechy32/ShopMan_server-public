import ShoppingList from "../model/ShoppingList.js";

export async function createList(data) {
    return await ShoppingList.create(data);
}

export async function getListById(id) {
    return await ShoppingList.findById(id)
        .populate("owner")
        .populate("members")
        .populate("items");
}

export async function getListsForUser(userId) {
    return await ShoppingList.find({
        $or: [
            { owner: userId },
            { members: userId }
        ]
    });
}

export async function getAllLists() {
    return await ShoppingList.find();
}

export async function addItemToList(listId, itemId) {
    return await ShoppingList.findByIdAndUpdate(
        listId,
        { $addToSet: { items: itemId } },
        { new: true }
    );
}

export async function addMemberToList(listId, userId) {
    return await ShoppingList.findByIdAndUpdate(
        listId,
        { $addToSet: { members: userId } },
        { new: true }
    );
}

export async function deleteMemberFromTheList(listId, userId) {
    return await ShoppingList.findByIdAndUpdate(
        listId,
        { $pull: { members: userId } },
        { new: true }
    );
}

export async function removeList(id) {
    return await ShoppingList.findByIdAndDelete(id);
}

export async function updateListInDb(listId, updateData) {
    return await ShoppingList.findByIdAndUpdate(
        listId,
        { $set: updateData },
        { new: true, runValidators: true }
    );
}

