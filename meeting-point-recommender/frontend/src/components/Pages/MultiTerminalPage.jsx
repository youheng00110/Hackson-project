/**
 * 房间码多终端模式页面组件
 * 功能：创建新房间、加入现有房间
 * 特性：简洁布局、与全局样式统一
 */

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlusCircle,    // 创建房间图标
  faSignInAlt,     // 加入房间图标
  faUsers          // 多人协作图标
} from '@fortawesome/free-solid-svg-icons';
import './MultiTerminalPage.css';

/**
 * 多终端模式页面组件
 */
const MultiTerminalPage = () => {
  // 房间码输入状态
  const [roomCode, setRoomCode] = useState('');

  /**
   * 处理创建房间
   */
  const handleCreateRoom = () => {
    console.log('创建新房间');
    // TODO: 实现创建房间逻辑
  };

  /**
   * 处理加入房间
   */
  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      alert('请输入房间码');
      return;
    }
    console.log('加入房间:', roomCode);
    // TODO: 实现加入房间逻辑
  };

  /**
   * 处理房间码输入变化
   * @param {Event} e - 输入事件
   */
  const handleRoomCodeChange = (e) => {
    // 只允许输入字母和数字，转换为大写
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value);
  };

  return (
    <div className="multi-terminal-page">
      {/* 页面标题 */}
      <div className="page-header">
        <h1 className="page-title">房间码多终端模式</h1>
        <p className="page-description">
          <FontAwesomeIcon icon={faUsers} className="description-icon" />
          多人协作模式：通过房间码邀请好友，共同规划会面点
        </p>
      </div>

      {/* 功能卡片区 */}
      <div className="feature-cards">
        {/* 创建新房间卡片 */}
        <div className="feature-card create-card">
          <div className="card-icon">
            <FontAwesomeIcon icon={faPlusCircle} />
          </div>
          <h2 className="card-title">创建新房间</h2>
          <p className="card-description">
            创建一个新的协作房间，生成专属房间码邀请好友加入
          </p>
          <button 
            className="action-btn primary-btn"
            onClick={handleCreateRoom}
          >
            <FontAwesomeIcon icon={faPlusCircle} />
            创建新房间
          </button>
        </div>

        {/* 加入现有房间卡片 */}
        <div className="feature-card join-card">
          <div className="card-icon">
            <FontAwesomeIcon icon={faSignInAlt} />
          </div>
          <h2 className="card-title">加入现有房间</h2>
          <p className="card-description">
            输入好友分享的房间码，加入已有的协作房间
          </p>
          
          <div className="join-input-group">
            <input
              type="text"
              className="room-code-input"
              placeholder="请输入 6 位房间码"
              value={roomCode}
              onChange={handleRoomCodeChange}
              maxLength={6}
            />
            <button 
              className="action-btn secondary-btn"
              onClick={handleJoinRoom}
              disabled={!roomCode.trim()}
            >
              <FontAwesomeIcon icon={faSignInAlt} />
              加入房间
            </button>
          </div>
          
          <div className="input-hint">
            房间码通常为 6 位大写字母或数字组合
          </div>
        </div>
      </div>

      {/* 功能说明区域 */}
      <div className="info-section">
        <h3 className="info-title">使用说明</h3>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-number">1</div>
            <div className="info-content">
              <h4>创建或加入房间</h4>
              <p>点击"创建新房间"生成房间码，或输入已有房间码加入</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-number">2</div>
            <div className="info-content">
              <h4>邀请好友加入</h4>
              <p>将房间码分享给好友，邀请他们加入协作房间</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-number">3</div>
            <div className="info-content">
              <h4>共同规划会面点</h4>
              <p>所有成员可以各自添加位置偏好，系统智能推荐最佳会面点</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiTerminalPage;
