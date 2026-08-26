// Xiaohuhu Local Agent File Service

export const FileService = {
  rootPath: null,

  init(config) {
    this.rootPath = config.rootPath;
  },

  async listFiles() {
    // 第一阶段仅定义接口
    // 后续由 Node.js/Electron 服务连接 Windows 文件系统
    return [];
  },

  async readFile(path) {
    // 后续实现本地文件读取
    return null;
  }
};
