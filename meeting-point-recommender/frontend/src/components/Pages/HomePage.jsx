/**
 * 首页组件 - 会面点智能推荐系统主页面
 * 功能：欢迎横幅、数据概览卡片、快捷操作区、最近会面记录
 * 特性：动态日期显示、静态模拟数据、现代扁平化设计
 */

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBuilding,      // 已创建房间数
  faCalendar,      // 本月使用次数
  faMapMarkerAlt,  // 热门会面类型
  faUserCheck,     // 活跃用户数
  faPlus,          // 创建新房间
  faFolderOpen,    // 查看我的房间
  faRoute,         // 路线规划
  faHistory,       // 历史记录
  faCog,           // 系统设置
  faArrowRight     // 查看全部箭头
} from '@fortawesome/free-solid-svg-icons';
import './HomePage.css';

// 模拟数据 - 数据概览卡片
const STATS_DATA = [
  {
    id: 1,
    title: '已创建房间数',
    value: 128,
    icon: faBuilding,
    trend: '+12%',
    trendType: 'up'
  },
  {
    id: 2,
    title: '本月使用次数',
    value: 356,
    icon: faCalendar,
    trend: '+24%',
    trendType: 'up'
  },
  {
    id: 3,
    title: '热门会面类型',
    value: '餐饮',
    subtitle: '占比 68%',
    icon: faMapMarkerAlt,
    trend: '+5%',
    trendType: 'up'
  },
  {
    id: 4,
    title: '活跃用户数',
    value: 89,
    icon: faUserCheck,
    trend: '+18%',
    trendType: 'up'
  }
];

// 模拟数据 - 快捷操作按钮
const QUICK_ACTIONS = [
  { id: 1, label: '创建新房间', icon: faPlus, color: '#3498db' },
  { id: 2, label: '查看我的房间', icon: faFolderOpen, color: '#2ecc71' },
  { id: 3, label: '路线规划', icon: faRoute, color: '#e74c3c' },
  { id: 4, label: '历史记录', icon: faHistory, color: '#f39c12' },
  { id: 5, label: '系统设置', icon: faCog, color: '#9b59b6' }
];

// 模拟数据 - 最近会面记录
const RECENT_RECORDS = [
  {
    id: 1,
    time: '2026-03-08 14:30',
    theme: '周末聚餐地点选择',
    participants: 5,
    status: 'completed'
  },
  {
    id: 2,
    time: '2026-03-07 10:15',
    theme: '商务会议地点推荐',
    participants: 3,
    status: 'completed'
  },
  {
    id: 3,
    time: '2026-03-06 16:45',
    theme: '朋友聚会咖啡厅',
    participants: 4,
    status: 'completed'
  },
  {
    id: 4,
    time: '2026-03-05 09:00',
    theme: '学习讨论地点',
    participants: 2,
    status: 'completed'
  },
  {
    id: 5,
    time: '2026-03-04 19:20',
    theme: '看电影集合地点',
    participants: 6,
    status: 'pending'
  }
];

/**
 * 首页组件
 */
const HomePage = () => {
  // 今日日期（动态获取）
  const [today, setToday] = useState('');

  useEffect(() => {
    // 格式化今日日期
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekDay = weekDays[date.getDay()];
    
    setToday(`${year}年${month}月${day}日 ${weekDay}`);
  }, []);

  return (
    <div className="home-page">
      {/* 欢迎横幅 */}
      <section className="welcome-banner">
        <div className="banner-content">
          <h1 className="banner-title">会面点智能推荐系统</h1>
          <p className="banner-subtitle">高效规划，轻松会面</p>
          <p className="banner-date">{today}</p>
        </div>
      </section>

      {/* 数据概览卡片 */}
      <section className="stats-section">
        <div className="stats-grid">
          {STATS_DATA.map(stat => (
            <div key={stat.id} className="stat-card">
              <div className="stat-header">
                <div className="stat-icon" style={{ backgroundColor: `${getIconColor(stat.icon)}20` }}>
                  <FontAwesomeIcon icon={stat.icon} style={{ color: getIconColor(stat.icon) }} />
                </div>
                <span className={`stat-trend ${stat.trendType === 'up' ? 'trend-up' : 'trend-down'}`}>
                  {stat.trend}
                </span>
              </div>
              <div className="stat-body">
                <p className="stat-value">{stat.value}</p>
                <p className="stat-label">{stat.title}</p>
                {stat.subtitle && <p className="stat-subtitle">{stat.subtitle}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 快捷操作区 */}
      <section className="quick-actions-section">
        <h2 className="section-title">快捷操作</h2>
        <div className="actions-grid">
          {QUICK_ACTIONS.map(action => (
            <button 
              key={action.id} 
              className="action-btn"
              style={{ borderColor: action.color }}
            >
              <FontAwesomeIcon 
                icon={action.icon} 
                className="action-icon"
                style={{ color: action.color }}
              />
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 最近会面记录 */}
      <section className="recent-records-section">
        <div className="section-header">
          <h2 className="section-title">最近会面记录</h2>
          <a href="#/single-terminal" className="view-all-link">
            查看全部
            <FontAwesomeIcon icon={faArrowRight} className="link-arrow" />
          </a>
        </div>
        <div className="records-list">
          {RECENT_RECORDS.map(record => (
            <div key={record.id} className="record-item">
              <div className="record-main">
                <div className="record-info">
                  <p className="record-time">{record.time}</p>
                  <p className="record-theme">{record.theme}</p>
                </div>
                <span className={`record-status status-${record.status}`}>
                  {record.status === 'completed' ? '已完成' : '待进行'}
                </span>
              </div>
              <div className="record-meta">
                <span className="record-participants">
                  <FontAwesomeIcon icon={faUserCheck} />
                  {record.participants}人参与
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/**
 * 根据图标类型返回对应颜色
 * @param {Object} icon - Font Awesome 图标对象
 * @returns {string} 颜色代码
 */
const getIconColor = (icon) => {
  const colors = {
    [faBuilding]: '#3498db',
    [faCalendar]: '#2ecc71',
    [faMapMarkerAlt]: '#e74c3c',
    [faUserCheck]: '#f39c12'
  };
  return colors[icon] || '#3498db';
};

export default HomePage;
