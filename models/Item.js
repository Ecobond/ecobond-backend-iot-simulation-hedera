// In-memory storage for items (can be replaced with a database)
let items = [
  {
    id: 1,
    title: "Sample Item 1",
    description: "This is a sample item",
    createdAt: new Date(),
  },
  {
    id: 2,
    title: "Sample Item 2",
    description: "Another sample item",
    createdAt: new Date(),
  },
];

let nextId = 3;

class Item {
  static getAll() {
    return items;
  }

  static getById(id) {
    return items.find((item) => item.id === parseInt(id));
  }

  static create(data) {
    const newItem = {
      id: nextId++,
      title: data.title,
      description: data.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    items.push(newItem);
    return newItem;
  }

  static update(id, data) {
    const item = items.find((item) => item.id === parseInt(id));
    if (!item) return null;

    if (data.title) item.title = data.title;
    if (data.description) item.description = data.description;
    item.updatedAt = new Date();

    return item;
  }

  static delete(id) {
    const index = items.findIndex((item) => item.id === parseInt(id));
    if (index === -1) return null;

    const deletedItem = items[index];
    items.splice(index, 1);
    return deletedItem;
  }
}

module.exports = Item;
