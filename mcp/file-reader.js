// MCP File Reader
// 未来用于连接本地文件系统

export const FileReader = {
  async read(path) {
    return {
      path,
      content: null,
      status: 'pending'
    };
  }
};
