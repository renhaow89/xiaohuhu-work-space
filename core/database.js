// 数据访问层预留
// 后续将接入 IndexedDB / 云端数据库

class Database {
  static async save(data) {
    localStorage.setItem('xiaohuhu_workspace', JSON.stringify(data));
  }

  static async load() {
    const data = localStorage.getItem('xiaohuhu_workspace');
    return data ? JSON.parse(data) : {};
  }
}

window.Database = Database;
