// Xiaohuhu Work Space data models
// Unified entity structure for future modules and AI extensions

const EntityTypes = {
  TASK: 'task',
  PAPER: 'paper',
  EXPERIMENT: 'experiment',
  NOTE: 'note',
  FILE: 'file'
};

function createEntity(type, data = {}) {
  return {
    id: `${type}_${Date.now()}`,
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    ...data
  };
}
