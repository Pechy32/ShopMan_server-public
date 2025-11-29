import {
    createList,
    getListsForUser,
    getListById,
    removeList,
    addMemberToList,
    addItemToList,
    getAllLists,
    deleteMemberFromTheList,
    updateListInDb
} from "../dao/shoppingListDao.js";
import { findUserById } from "../dao/userDao.js";
import Item from "../model/Item.js";

export async function createShoppingList(name, ownerId) {
    return await createList({ name, owner: ownerId });
}

export async function getLists(userId, role) {
    if (role === "StandartUsers") {
        return await getListsForUser(userId);
    } else if (role === "Executives" || role === "Authorities") {
        return await getAllLists();
    } else {
        throw new Error("Unknown role");
    }
}

export async function getList(listId, userId, role) {
    const list = await getListById(listId);
    if (!list) {
        throw new Error("List not found");
    }

    // StandartUser access
    if (role === "StandartUsers") {
        const isOwner = list.owner?._id?.toString() === userId.toString();
        const isMember = list.members?.some(
            member => member._id?.toString() === userId.toString()
        );

        if (!isOwner && !isMember) {
            throw new Error("Access denied - you are not a member or owner of this list");
        }

        // Executives, Authorities access
    } else if (role === "Executives" || role === "Authorities") {
    } else {
        throw new Error("Unknown role");
    }

    return list;
}


export async function deleteList(id, userId, role) {

    const list = await getListById(id);
    if (!list) throw new Error("List not found");

    // StandartUser access
    if (role == "StandartUsers") {
        if (list.owner.id.toString() !== userId.toString()) {
            throw new Error("Only the owner can delete the list");
        }
    }

    // Executives, Authorities access
    else if (role === "Executives" || role === "Authorities") {
    } else {
        throw new Error("Unknown role");
    }
    return await removeList(id);
}

export async function addMember(listId, userId, requesterId, role) {
    const list = await getListById(listId);
    if (!list) throw new Error("List not found");

    // StandartUsers access
    if (role == "StandartUsers") {
        if (list.owner.id.toString() !== requesterId.toString()) {
            throw new Error("Only the owner can add members");
        }
    }

    // Executives, Authorities access
    else if (role === "Executives" || role === "Authorities") {
    } else {
        throw new Error("Unknown role");
    }

    // User existence check
    const member = await findUserById(userId)
    if (!member) {
        throw new Error("User not found");
    }

    return await addMemberToList(listId, userId);
}

export async function addItem(listId, itemId, userId) {
    // Access check: user must be owner or member
    const list = await getListById(listId);
    if (!list) throw new Error("List not found");

    const isAllowed =
        list.owner.toString() === userId.toString() ||
        list.members.some(m => m.toString() === userId.toString());

    if (!isAllowed)
        throw new Error("User does not have access to this list");

    return await addItemToList(listId, itemId);
}

export async function removeMember(listId, memberId, requesterId, role) {
    const list = await getListById(listId);
    if (!list) throw new Error("List not found");

    // Access controll
    if (role === "StandartUsers") {
        if (list.owner._id?.toString() !== requesterId.toString()) {
            throw new Error("Only the owner can remove members");
        }
    }
    else if (role === "Executives" || role === "Authorities") {
    } else {
        throw new Error("Unknown role");
    }

    // Check if member exists
    const isMember = list.members.some(m => m._id?.toString() === memberId.toString());
    if (!isMember) {
        throw new Error("User is not a member of this list");
    }

    const updatedList = await deleteMemberFromTheList(listId, memberId);
    return updatedList;
}

export async function updateList(listId, dtoIn, requesterId, role) {
    const list = await getListById(listId);
    if (!list) throw new Error("List not found");

    // Access controll
    if (role === "StandartUsers") {
        const isOwner = list.owner._id?.toString() === requesterId.toString();
        if (!isOwner) {
            throw new Error("Only the owner can edit this list");
        }
    } else if (role === "Executives" || role === "Authorities") {
    } else {
        throw new Error("Unknown role");
    }


    const updateData = {};
    if (dtoIn.name !== undefined) updateData.name = dtoIn.name;
    if (dtoIn.isArchived !== undefined) updateData.isArchived = dtoIn.isArchived;

    const updatedList = await updateListInDb(listId, updateData);
    return updatedList;
}

export async function createItemForList(listId, dtoIn, requesterId, role) {
    const list = await getListById(listId);
    if (!list) throw new Error("List not found");

    // Access control
    if (role === "StandartUsers") {
        const isOwner = list.owner._id?.toString() === requesterId.toString();
        const isMember = list.members.some(
            m => m._id?.toString() === requesterId.toString()
        );

        if (!isOwner && !isMember) {
            throw new Error("Access denied - you are not a member or owner of this list");
        }
    } else if (role === "Executives" || role === "Authorities") {
    } else {
        throw new Error("Unknown role");
    }

    // Create Item as mongoose document
    const newItem = new Item({
        name: dtoIn.name,
        addedBy: requesterId
    });
    await newItem.save();

    // Add Item to list
    list.items.push(newItem._id);
    await list.save();

    return newItem;
}

export async function deleteItemFromList(listId, itemId, requesterId, role) {
    const list = await getListById(listId);
    if (!list) throw new Error("List not found");

    // Access control
    if (role === "StandartUsers") {
        const isOwner = list.owner._id?.toString() === requesterId.toString();
        const isMember = list.members.some(
            m => m._id?.toString() === requesterId.toString()
        );

        if (!isOwner && !isMember) {
            throw new Error("Access denied - you are not a member or owner of this list");
        }
    } else if (role === "Executives" || role === "Authorities") {
    } else {
        throw new Error("Unknown role");
    }
    // Check if item belongs to this list
    const containsItem = list.items.some(i => i.id.toString() === itemId.toString());
    if (!containsItem) {
        throw new Error("Item does not belong to this list");
    }

    // Remove item reference from list
    list.items.pull(itemId);
    await list.save();

    // Delete the actual item document 
    await Item.findByIdAndDelete(itemId);

    return list;
}

export async function updateItemInList(listId, itemId, dtoIn, requesterId, role) {
    const list = await getListById(listId);
    if (!list) throw new Error("List not found");

    // Access control
    if (role === "StandartUsers") {
        const isOwner = list.owner._id?.toString() === requesterId.toString();
        const isMember = list.members.some(
            m => m._id?.toString() === requesterId.toString()
        );

        if (!isOwner && !isMember) {
            throw new Error("Access denied – you are not a member or owner of this list");
        }
    } else if (role === "Executives" || role === "Authorities") {
    } else {
        throw new Error("Unknown role");
    }

    // Check if item belongs to this list
    const containsItem = list.items.some(i => i.id.toString() === itemId.toString());
    if (!containsItem) {
        throw new Error("Item does not belong to this list");
    }

    // Find and update item
    const item = await Item.findById(itemId);
    if (!item) throw new Error("Item not found");

    if (dtoIn.name) item.name = dtoIn.name.trim();
    if ("solvedBy" in dtoIn) item.solvedBy = dtoIn.solvedBy || null;

    await item.save();

    return item;
}




