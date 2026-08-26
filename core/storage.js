// Xiaohuhu Work Space Storage Layer
// Unified data access interface

const Storage = {
  async save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  async load(key, defaultValue = null) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  },

  async remove(key) {
    localStorage.removeItem(key);
  },

  exportAll() {
    const result = {};
    Object.keys(localStorage).forEach((key) => {
      result[key] = JSON.parse(localStorage.getItem(key));
    });
    return result;
  }
};

export default Storage;
