/**
 * 侧边栏导航组件
 * 功能：可折叠/展开的左侧边栏，包含 4 个核心页面入口
 * 特性：平滑过渡动画、选中高亮、Font Awesome 图标
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome,           // 首页图标
  faUsers,          // 多终端模式图标
  faUser,           // 单终端模式图标
  faClock,          // 开发中图标
  faBars,           // 折叠按钮图标
  faChevronLeft     // 展开按钮图标
} from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

// 菜单项配置数据
const MENU_ITEMS = [
  { id: 'home', label: '首页', icon: faHome },
  { id: 'multiTerminal', label: '房间码多终端模式', icon: faUsers },
  { id: 'singleTerminal', label: '单终端模式', icon: faUser },
  { id: 'developing', label: '开发中', icon: faClock }
];

/**
 * 侧边栏组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.collapsed - 是否折叠状态
 * @param {string} props.currentPage - 当前页面名称
 * @param {function} props.onToggle - 折叠/展开切换回调
 * @param {function} props.onNavigate - 页面跳转回调
 */
const Sidebar = ({ collapsed, currentPage, onToggle, onNavigate }) => {
  // 调试信息：检查菜单项和当前页面
  console.log('Sidebar 渲染:', { 
    collapsed, 
    currentPage, 
    menuItemsCount: MENU_ITEMS.length,
    menuItems: MENU_ITEMS.map(m => m.label)
  });
  
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* 侧边栏头部 - 包含折叠按钮 */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="logo-section">
            <h1>会面点推荐</h1>
            <p className="subtitle">智能规划 · 高效会面</p>
          </div>
        )}
        <button 
          className="toggle-btn" 
          onClick={onToggle}
          title={collapsed ? '展开菜单' : '收起菜单'}
        >
          <FontAwesomeIcon icon={collapsed ? faBars : faChevronLeft} />
        </button>
      </div>

      {/* 菜单项列表 */}
      <nav className="sidebar-nav">
        {console.log('渲染菜单项，数量:', MENU_ITEMS.length)}
        {MENU_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : ''}
          >
            {/* 图标 */}
            <span className="nav-icon">
              <FontAwesomeIcon icon={item.icon} />
            </span>
            
            {/* 文字标签（仅在展开时显示） */}
            {!collapsed && (
              <span className="nav-label">{item.label}</span>
            )}
            
            {/* 选中指示器 */}
            {currentPage === item.id && (
              <span className="active-indicator"></span>
            )}
          </button>
        ))}
      </nav>

      {/* 侧边栏底部信息 */}
      {!collapsed && (
        <div className="sidebar-footer">
          <p className="version-info">v1.0.0</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
