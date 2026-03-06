const Item = require("../models/Item");
const logger = require("../utils/logger");

// Get all items
exports.getAllItems = (req, res) => {
  try {
    logger.info("Fetching all items");
    const items = Item.getAll();
    logger.info(`Retrieved ${items.length} items`);
    res.status(200).json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    logger.error("Error fetching items:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a single item by ID
exports.getItemById = (req, res) => {
  try {
    const itemId = req.params.id;
    logger.info(`Fetching item with ID: ${itemId}`);
    const item = Item.getById(itemId);

    if (!item) {
      logger.warn(`Item not found with ID: ${itemId}`);
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }

    logger.info(`Item retrieved successfully: ${itemId}`);
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    logger.error("Error fetching item:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new item
exports.createItem = (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      logger.warn("Create item failed: Title is required");
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    logger.info("Creating new item", { title });
    const newItem = Item.create({
      title,
      description: description || "",
    });

    logger.info(`Item created successfully with ID: ${newItem.id}`);
    res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: newItem,
    });
  } catch (error) {
    logger.error("Error creating item:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update an item
exports.updateItem = (req, res) => {
  try {
    const itemId = req.params.id;
    const { title, description } = req.body;

    logger.info(`Updating item with ID: ${itemId}`);
    const updatedItem = Item.update(itemId, {
      title,
      description,
    });

    if (!updatedItem) {
      logger.warn(`Update failed: Item not found with ID: ${itemId}`);
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }

    logger.info(`Item updated successfully: ${itemId}`);
    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    logger.error("Error updating item:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete an item
exports.deleteItem = (req, res) => {
  try {
    const itemId = req.params.id;
    logger.info(`Deleting item with ID: ${itemId}`);
    const deletedItem = Item.delete(itemId);

    if (!deletedItem) {
      logger.warn(`Delete failed: Item not found with ID: ${itemId}`);
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }

    logger.info(`Item deleted successfully: ${itemId}`);
    res.status(200).json({
      success: true,
      message: "Item deleted successfully",
      data: deletedItem,
    });
  } catch (error) {
    logger.error("Error deleting item:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};
