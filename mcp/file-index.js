// MCP File Index
// 未来用于建立个人知识库索引

export const FileIndex = {
  files: [],

  async scan(path) {
    // 浏览器无法直接扫描电脑目录
    // 后续通过本地 MCP 服务连接真实文件系统
    return {
      root: path,
      files: this.files
    };
  },

  search(keyword) {
    return this.files.filter(file =>
      file.name.includes(keyword)
    );
  }
};
