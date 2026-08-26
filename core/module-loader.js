// Xiaohuhu Work Space module loader

export function loadModule(moduleName, moduleInstance) {
  return {
    name: moduleName,
    instance: moduleInstance,
    loadedAt: new Date().toISOString()
  };
}
