/**
 * 多人会面点推荐系统 - 主应用组件（路由容器）
 * 功能：根据路由渲染对应的页面组件
 */

import { useState, useEffect } from 'react';
import MainLayout from './components/Layout/MainLayout';
import HomePage from './components/Pages/HomePage';
import MultiTerminalPage from './components/Pages/MultiTerminalPage';
import SingleTerminalPage from './components/Pages/SingleTerminalPage';
import DevelopingPage from './components/Pages/DevelopingPage';
import { listenRouteChanges } from './services/router';
import './App.css';

/**
 * 路由页面映射表
 */
const PAGE_COMPONENTS = {
  home: HomePage,
  multiTerminal: MultiTerminalPage,
  singleTerminal: SingleTerminalPage,
  developing: DevelopingPage
};

function App() {
  // 当前页面
  const [currentPage, setCurrentPage] = useState('home');

  // 监听路由变化
  useEffect(() => {
    console.log('App: 开始监听路由变化');
    const unsubscribe = listenRouteChanges((page) => {
      console.log('App: 路由变化:', page);
      setCurrentPage(page);
    });

    // 清理函数
    return () => {
      console.log('App: 清理路由监听器');
      unsubscribe();
    };
  }, []);

  // 获取当前页面组件
  const CurrentPageComponent = PAGE_COMPONENTS[currentPage] || HomePage;

  return (
    <MainLayout>
      {/* 根据路由渲染对应页面 */}
      <CurrentPageComponent />
    </MainLayout>
  );
}

export default App;
