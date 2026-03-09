/**
 * 开发中页面组件
 * 功能：占位提示页面，展示功能正在开发中
 * 特性：简洁友好、居中布局、返回首页按钮
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHourglassHalf, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import './DevelopingPage.css';

/**
 * 开发中页面组件
 */
const DevelopingPage = () => {
  /**
   * 返回首页
   */
  const handleBackToHome = () => {
    window.location.hash = '#/home';
  };

  return (
    <div className="developing-page">
      {/* 页面容器 */}
      <div className="developing-content">
        {/* 图标区域 */}
        <div className="icon-container">
          <FontAwesomeIcon icon={faHourglassHalf} className="main-icon" />
        </div>

        {/* 标题区域 */}
        <h1 className="developing-title">功能开发中</h1>
        
        {/* 副标题 */}
        <p className="developing-subtitle">
          该功能正在紧张开发中，敬请期待！
        </p>

        {/* 返回按钮 */}
        <button 
          className="back-btn"
          onClick={handleBackToHome}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="back-icon" />
          返回首页
        </button>
      </div>
    </div>
  );
};

export default DevelopingPage;
