// globalCache.js
let listeners = [];

export const APP_MEMORY = {
  data: { contacts: [], meetings: [], tasks: [], notes: [] },

  subscribe(callback) {
    listeners.push(callback);
    return () => listeners = listeners.filter(l => l !== callback);
  },

  update(category, items) {
    this.data[category] = items;
    console.log(`[Memory] Updated ${category}:`, items.length);
    // আপডেট হলে সবাইকে জানাও
    listeners.forEach(cb => cb(this.data));
  },

  getAll() {
    return this.data;
  },
};