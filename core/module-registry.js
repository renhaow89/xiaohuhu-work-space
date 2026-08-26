// Module Registry
// Manage application modules

const ModuleRegistry = {
  modules: {},

  register(name, module) {
    this.modules[name] = module;
  },

  get(name) {
    return this.modules[name];
  },

  list() {
    return Object.keys(this.modules);
  }
};

export default ModuleRegistry;
