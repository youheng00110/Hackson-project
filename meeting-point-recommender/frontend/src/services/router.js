/**
 * 前端路由服务 - 基于 location.hash 的简单路由实现
 * 提供路由监听、跳转工具函数和路由配置
 */

// 路由配置映射表
export const routes = {
  '': 'home',                    // 根路径默认跳转到首页
  '#/home': 'home',              // 首页
  '#/multi-terminal': 'multiTerminal',  // 房间码多终端模式
  '#/single-terminal': 'singleTerminal', // 单终端模式
  '#/developing': 'developing'   // 开发中页面
};

/**
 * 获取当前路由对应的页面名称
 * @returns {string} 页面名称 (home/multiTerminal/singleTerminal/developing)
 */
export const getCurrentPage = () => {
  const hash = window.location.hash;
  return routes[hash] || routes[''];
};

/**
 * 跳转到指定页面
 * @param {string} pageName - 页面名称 (home/multiTerminal/singleTerminal/developing)
 */
export const navigateTo = (pageName) => {
  const routeMap = {
    'home': '#/home',
    'multiTerminal': '#/multi-terminal',
    'singleTerminal': '#/single-terminal',
    'developing': '#/developing'
  };
  
  if (routeMap[pageName]) {
    window.location.hash = routeMap[pageName];
  }
};

/**
 * 监听路由变化
 * @param {function} callback - 路由变化时的回调函数，接收 currentPage 参数
 * @returns {function} 取消监听的函数
 */
export const listenRouteChanges = (callback) => {
  // 初始化时触发一次
  callback(getCurrentPage());
  
  // 监听 hashchange 事件
  const handleHashChange = () => {
    callback(getCurrentPage());
  };
  
  window.addEventListener('hashchange', handleHashChange);
  
  // 返回取消监听的函数
  return () => {
    window.removeEventListener('hashchange', handleHashChange);
  };
};

/**
 * 路由工具类 - 提供面向对象的使用方式
 */
class Router {
  constructor() {
    this.currentPage = null;
    this.listeners = [];
  }

  /**
   * 初始化路由器，开始监听路由变化
   */
  init() {
    this.currentPage = getCurrentPage();
    
    // 监听路由变化
    window.addEventListener('hashchange', () => {
      const newPage = getCurrentPage();
      this.currentPage = newPage;
      
      // 通知所有监听者
      this.listeners.forEach(callback => callback(newPage));
    });
    
    return this;
  }

  /**
   * 添加路由变化监听器
   * @param {function} callback - 回调函数
   */
  subscribe(callback) {
    this.listeners.push(callback);
    
    // 立即触发一次，让监听器获取当前页面
    callback(this.currentPage);
    
    return this;
  }

  /**
   * 移除路由变化监听器
   * @param {function} callback - 要移除的回调函数
   */
  unsubscribe(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
    return this;
  }

  /**
   * 跳转到指定页面
   * @param {string} pageName - 页面名称
   */
  navigate(pageName) {
    navigateTo(pageName);
    return this;
  }

  /**
   * 获取当前页面
   * @returns {string} 当前页面名称
   */
  getCurrentPage() {
    return this.currentPage || getCurrentPage();
  }
}

// 导出单例
export const router = new Router();

export default {
  routes,
  getCurrentPage,
  navigateTo,
  listenRouteChanges,
  router
};
