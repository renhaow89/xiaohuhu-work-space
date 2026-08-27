// Xiaohuhu Work Space — 统一版本管理
// 所有模块通过此文件获取 app 名称、版本号、schema 版本
// 修改版本时只需修改此文件

const AppVersion = {
  /** 应用标识符，用于备份文件校验 */
  app: 'xiaohuhu-work-space',

  /** 应用版本号（语义化版本） */
  version: '1.2.3',

  /**
   * 数据 Schema 版本号（整数）
   * 每次数据结构发生不兼容变化时 +1
   * schema=1: V1.0.x 初始结构 & V1.1/V1.2 扩展（向下兼容）
   */
  schema: 1
};

export default AppVersion;
