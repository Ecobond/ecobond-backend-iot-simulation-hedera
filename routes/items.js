const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");

// Get all items
router.get("/", itemController.getAllItems);

// Get a single item by ID
router.get("/:id", itemController.getItemById);

// Create a new item
router.post("/", itemController.createItem);

// Update an item
router.put("/:id", itemController.updateItem);

// Delete an item
router.delete("/:id", itemController.deleteItem);

module.exports = router;
