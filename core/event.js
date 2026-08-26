// Event System
// Allow modules to communicate with each other

const EventBus = {
  events: {},

  on(name, callback) {
    if (!this.events[name]) {
      this.events[name] = [];
    }
    this.events[name].push(callback);
  },

  emit(name, data) {
    (this.events[name] || []).forEach(callback => callback(data));
  }
};

export default EventBus;
