// Xiaohuhu Work Space — 数据模型定义
// V1.0.7: 添加正确的 export

/** 实体类型枚举 */
export const EntityTypes = {
  TASK: 'task',
  PAPER: 'paper',
  EXPERIMENT: 'experiment',
  NOTE: 'note',
  FILE: 'file',
  JOURNAL: 'journal',
  READING: 'reading',
  RESEARCH: 'research'
};

/**
 * 创建标准实体对象
 * 为每个实体注入统一字段： id, type, createdAt, updatedAt, tags
 *
 * @param {string} type 实体类型（建议使用 EntityTypes 枚举）
 * @param {object} data 额外数据
 * @returns {object} 标准实体对象
 */
export function createEntity(type, data = {}) {
  const now = new Date().toISOString();
  return {
    id: `${type}_${Date.now()}`,
    type,
    createdAt: now,
    updatedAt: now,
    tags: [],
    ...data
  };
}
