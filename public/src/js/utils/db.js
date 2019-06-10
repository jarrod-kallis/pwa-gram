const dbPromise = idb.open('posts-store', 1, db => {
  if (!db.objectStoreNames.contains('posts')) {
    // Table & primary key
    db.createObjectStore('posts', { keyPath: 'id' });
  }
});

function writeData(table, data) {
  return dbPromise.then(db => {
    console.log('trying to store:', data);
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    store.put(data);
    return tx.complete;
  });
}

function readData(table) {
  return dbPromise.then(db => {
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    return store.getAll();
  });
}

function clearData(table) {
  return dbPromise.then(db => {
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    store.clear();
    return tx.complete;
  });
}

function deleteSingleItem(table, id) {
  return dbPromise
    .then(db => {
      const tx = db.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      store.delete(id);
      return tx.complete;
    })
    .then(() => {
      console.log('Item deleted:', id);
    });
}
