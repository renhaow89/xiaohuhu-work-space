// AI Memory Interface

const Memory = {
  records: [],

  save(item) {
    this.records.push(item);
  },

  list() {
    return this.records;
  }
};

export default Memory;
