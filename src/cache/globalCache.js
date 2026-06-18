// globalCache.js — Smart Cache with TTL + Ready State
let listeners = [];

const CACHE_TTL = 5 * 60 * 1000; 

export const APP_MEMORY = {
  data: { contacts: [], meetings: [], tasks: [], notes: [] },
  lastUpdated: {},
  isReady: false, 
  _readyResolvers: [],

    waitUntilReady() {
    if (this.isReady) return Promise.resolve();
    return new Promise((resolve) => {
      this._readyResolvers.push(resolve);
    });
  },

  markReady() {
    this.isReady = true;
    this._readyResolvers.forEach((r) => r());
    this._readyResolvers = [];
    console.log('[Cache] Memory is READY ✓');
  },

  subscribe(callback) {
    listeners.push(callback);
    return () => (listeners = listeners.filter((l) => l !== callback));
  },

  update(category, items) {
    this.data[category] = items;
    this.lastUpdated[category] = Date.now();
    console.log(`[Cache] Updated "${category}": ${items.length} items`);
    listeners.forEach((cb) => cb(this.data));
  },

  // TTL check — stale হলে re-sync দরকার
  isStale(category) {
    const last = this.lastUpdated[category];
    if (!last) return true;
    return Date.now() - last > CACHE_TTL;
  },

  getAll() {
    return this.data;
  },

  // কোনো category-তে কিছু আছে কিনা
  has(category) {
    return this.data[category]?.length > 0;
  },
};