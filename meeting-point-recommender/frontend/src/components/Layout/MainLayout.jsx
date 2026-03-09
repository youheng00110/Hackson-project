/**
 * 主布局容器组件
 * 功能：左侧边栏 + 右侧内容区的经典布局
 * 特性：响应式适配、页面切换淡入动画
 */

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import { navigateTo, listenRouteChanges } from '../../services/router';
import './MainLayout.css';

/**
 * 主布局容器组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件（页面内容）
 */
const MainLayout = ({ children }) => {
  // 侧边栏折叠状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // 当前页面
  const [currentPage, setCurrentPage] = useState('home');

  /**
   * 处理页面跳转
   * @param {string} pageId - 页面 ID
   */
  const handleNavigate = useCallback((pageId) => {
    navigateTo(pageId);
  }, []);

  /**
   * 处理侧边栏折叠/展开切换
   */
  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  /**
   * 监听路由变化
   */
  useEffect(() => {
    console.log('MainLayout: 开始监听路由变化');
    // 订阅路由变化
    const unsubscribe = listenRouteChanges((page) => {
      console.log('MainLayout: 路由变化检测到:', page);
      setCurrentPage(page);
      
      // 路由变化时，在移动端自动收起侧边栏
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      }
    });

    // 清理函数
    return () => {
      console.log('MainLayout: 清理路由监听器');
      unsubscribe();
    };
  }, []);

  return (
    <div className="main-layout">
      {/* 左侧边栏 */}
      <Sidebar
        collapsed={sidebarCollapsed}
        currentPage={currentPage}
        onToggle={handleToggleSidebar}
        onNavigate={handleNavigate}
      />

      {/* 右侧主内容区 */}
      <main className="content-wrapper">
        <div className="content-container">
          {/* 页面内容 - 带淡入动画 */}
          <div className="page-content fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
