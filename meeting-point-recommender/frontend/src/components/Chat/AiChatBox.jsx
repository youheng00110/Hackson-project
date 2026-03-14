/**
 * AI 对话框组件
 * 功能：用户通过自然语言输入需求，AI 解析并执行会面点搜索
 * 特性：对话历史展示、实时消息、参数自动解析
 */

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane,      // 发送按钮图标
  faRobot,           // AI 头像图标
  faUser,            // 用户头像图标
  faSpinner,         // 加载图标
  faMapMarkerAlt,    // 会面点图标
  faInfoCircle       // 信息图标
} from '@fortawesome/free-solid-svg-icons';
import './AiChatBox.css';

/**
 * AI 对话框组件
 * @param {Object} props - 组件属性
 * @param {Array} props.conversation - 对话历史数组 [{role, content, timestamp}]
 * @param {Function} props.onSendMessage - 发送消息回调函数
 * @param {boolean} props.isLoading - AI 是否正在处理
 * @param {Function} props.onParametersParsed - 参数解析完成回调
 */
const AiChatBox = ({ conversation = [], onSendMessage, isLoading = false, onParametersParsed }) => {
  // 用户输入状态
  const [inputValue, setInputValue] = useState('');
  
  // 自动滚动到底部的引用
  const messagesEndRef = useRef(null);
  
  // 输入框引用
  const inputRef = useRef(null);

  /**
   * 自动滚动到最新消息
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当对话历史更新时自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  /**
   * 处理发送消息
   */
  const handleSend = () => {
    const message = inputValue.trim();
    if (message && !isLoading) {
      onSendMessage(message);
      setInputValue('');
    }
  };

  /**
   * 处理回车发送
   * @param {KeyboardEvent} e - 键盘事件
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * 渲染单条消息
   * @param {Object} message - 消息对象
   * @param {number} index - 消息索引
   */
  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    
    return (
      <div 
        key={index} 
        className={`message ${isUser ? 'user-message' : 'ai-message'}`}
      >
        {/* 头像 */}
        <div className="message-avatar">
          <FontAwesomeIcon 
            icon={isUser ? faUser : faRobot} 
            className={isUser ? 'user-icon' : 'ai-icon'}
          />
        </div>
        
        {/* 消息内容 */}
        <div className="message-content">
          <div className="message-text">
            {message.content}
          </div>
          <div className="message-time">
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    );
  };

  /**
   * 渲染参数解析结果卡片
   * @param {Object} parsedParams - 解析出的参数
   */
  const renderParameterCard = (parsedParams) => {
    if (!parsedParams) return null;

    return (
      <div className="parameter-card">
        <div className="card-header">
          <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
          <span>参数解析结果</span>
        </div>
        <div className="card-content">
          <div className="param-item">
            <span className="param-label">会面类型：</span>
            <span className="param-value">{parsedParams.types?.join('、') || '未指定'}</span>
          </div>
          <div className="param-item">
            <span className="param-label">搜索半径：</span>
            <span className="param-value">{parsedParams.radius || '3000'}米</span>
          </div>
          <div className="param-item">
            <span className="param-label">计算策略：</span>
            <span className="param-value">
              {parsedParams.strategy === 'balanced' && '综合推荐'}
              {parsedParams.strategy === 'time_gap' && '时间差最小'}
              {parsedParams.strategy === 'distance_gap' && '距离差最小'}
              {!parsedParams.strategy && '默认推荐'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  /**
   * 渲染加载状态消息
   */
  const renderLoadingMessage = () => {
    if (!isLoading) return null;

    return (
      <div className="message ai-message">
        <div className="message-avatar">
          <FontAwesomeIcon icon={faRobot} className="ai-icon" />
        </div>
        <div className="message-content">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="message-text">正在分析您的需求...</div>
        </div>
      </div>
    );
  };

  return (
    <div className="ai-chat-container">
      {/* 对话区域标题 */}
      <div className="chat-header">
        <div className="header-icon">
          <FontAwesomeIcon icon={faRobot} />
        </div>
        <div className="header-text">
          <h3>AI 智能助手</h3>
          <p>告诉我您的会面需求，我来帮您智能规划</p>
        </div>
      </div>

      {/* 对话历史区域 */}
      <div className="messages-container">
        {/* 欢迎消息 */}
        {conversation.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-icon">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
            </div>
            <h4>您好！我是您的会面点规划助手</h4>
            <p>您可以这样问我：</p>
            <ul>
              <li>"找一个适合聚餐的地方，距离大家都不远"</li>
              <li>"找个咖啡馆，步行10分钟内能到"</li>
              <li>"推荐一个购物中心，交通便利的"</li>
            </ul>
          </div>
        )}

        {/* 对话消息列表 */}
        {conversation.map((msg, index) => renderMessage(msg, index))}
        
        {/* 加载状态 */}
        {renderLoadingMessage()}
        
        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="message-input"
            placeholder="请输入您的会面需求..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            rows={3}
          />
          <button
            className={`send-button ${isLoading ? 'loading' : ''}`}
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            title={isLoading ? 'AI 正在思考中...' : '发送消息'}
          >
            {isLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} />
            )}
          </button>
        </div>
        
        {/* 输入提示 */}
        <div className="input-hint">
          <small>按 Enter 发送，Shift + Enter 换行</small>
        </div>
      </div>
    </div>
  );
};

export default AiChatBox;
