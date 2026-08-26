// Xiaohuhu Work Space — 数据迁移管理器
// 支持旧 schema 升级到新 schema
// 设计原则：每个 schema 跨越对应一个 migrate 函数，链式执行

import AppVersion from './version.js';

/**
 * 各 schema 版本的迁移函数映射表
 * key: 迁移前的 schema 版本
 * value: 迁移函数，接收旧数据，返回升级后的新数据
 *
 * 未来扩展示例：
 *   migrations[2] = (data) => { ...data, newField: 'default' };
 */
const migrations = {
  /**
   * schema 1 → schema 2 迁移
   * 计划用于云同步阶段（V1.1+）
   * 目前为占位，庅启动时填充具体内容
   */
  1: (data) => {
    // TODO: V1.1 云同步阶段填充此处
    // 例如：为每个条目添加 userId 字段
    console.log('[Migration] schema 1 → 2: no-op (not yet implemented)');
    return data;
  }
};

const MigrationManager = {

  /**
   * 检查备份数据是否需要迁移
   * @param {object} backup 备份文件对象
   * @returns {boolean}
   */
  needsMigration(backup) {
    return (
      typeof backup.schema === 'number' &&
      backup.schema < AppVersion.schema
    );
  },

  /**
   * 执行迁移：将 backup.data 从 backup.schema 逐步升级到当前 schema
   * 采用链式迁移模式，自动逐级迁移
   *
   * @param {object} backup 备份文件对象 { schema, data, ... }
   * @returns {{ schema: number, data: object }} 迁移后的数据
   */
  migrate(backup) {
    let { schema, data } = backup;

    if (!this.needsMigration(backup)) {
      console.log(`[Migration] Schema ${schema} is current, no migration needed.`);
      return { schema, data };
    }

    console.log(`[Migration] Starting migration from schema ${schema} to ${AppVersion.schema}`);

    // 链式迁移：自当前 schema 逐步升级到最新版本
    while (schema < AppVersion.schema) {
      const migrateFn = migrations[schema];

      if (!migrateFn) {
        throw new Error(
          `[Migration] No migration function found for schema ${schema} → ${schema + 1}`
        );
      }

      console.log(`[Migration] Running migration: schema ${schema} → ${schema + 1}`);
      data = migrateFn(data);
      schema += 1;
    }

    console.log(`[Migration] Migration complete. Now at schema ${schema}.`);
    return { schema, data };
  }
};

export default MigrationManager;
