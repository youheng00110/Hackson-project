/**
 * 右侧弹出结果面板组件
 * 功能：从右侧滑出显示会面点推荐结果和路线选择
 * 特性：可折叠、平滑动画、响应式设计
 */

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes,           // 关闭图标
  faChevronRight,    // 右箭头
  faChevronLeft,     // 左箭头
  faRoute,           // 路线图标
  faStar,            // 星星图标
  faWalking,         // 步行图标
  faCar,             // 汽车图标
  faSubway           // 地铁图标
} from '@fortawesome/free-solid-svg-icons';
import MeetingPointCard from '../Result/MeetingPointCard';
import './ResultsPanel.css';

/**
 * 右侧结果面板组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.isOpen - 面板是否打开
 * @param {Function} props.onToggle - 切换面板开关的回调
 * @param {Array} props.meetingPoints - 会面点数据
 * @param {Object} props.selectedPoint - 当前选中的会面点
 * @param {Function} props.onSelectPoint - 选择会面点的回调
 * @param {Array} props.routes - 路线数据
 * @param {Function} props.onSelectRoute - 选择路线的回调
 */
const ResultsPanel = ({ 
  isOpen, 
  onToggle, 
  meetingPoints = [], 
  selectedPoint, 
  onSelectPoint,
  routes = [],
  onSelectRoute
}) => {
  // 当前面板视图状态 ('points' | 'routes')
  const [currentView, setCurrentView] = useState('points');

  /**
   * 获取交通方式图标
   * @param {string} mode - 交通方式
   */
  const getTransportIcon = (mode) => {
    switch (mode) {
      case 'walking':
        return faWalking;
      case 'driving':
        return faCar;
      case 'transit':
        return faSubway;
      default:
        return faWalking;
    }
  };

  /**
   * 获取交通方式中文名称
   * @param {string} mode - 交通方式
   */
  const getTransportLabel = (mode) => {
    switch (mode) {
      case 'walking':
        return '步行';
      case 'driving':
        return '驾车';
      case 'transit':
        return '公共交通';
      default:
        return '步行';
    }
  };

  return (
    <>
      {/* 折叠按钮 */}
      <button 
        className={`panel-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        title={isOpen ? '收起面板' : '展开面板'}
      >
        <FontAwesomeIcon icon={isOpen ? faChevronRight : faChevronLeft} />
      </button>

      {/* 面板容器 */}
      <div className={`results-panel ${isOpen ? 'open' : ''}`}>
        {/* 面板头部 */}
        <div className="panel-header">
          <div className="header-tabs">
            <button 
              className={`tab-btn ${currentView === 'points' ? 'active' : ''}`}
              onClick={() => setCurrentView('points')}
            >
              <FontAwesomeIcon icon={faStar} />
              推荐点
            </button>
            <button 
              className={`tab-btn ${currentView === 'routes' ? 'active' : ''}`}
              onClick={() => setCurrentView('routes')}
              disabled={routes.length === 0}
            >
              <FontAwesomeIcon icon={faRoute} />
              路线规划
            </button>
          </div>
          <button className="close-btn" onClick={onToggle}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* 面板内容 */}
        <div className="panel-content">
          {/* 推荐点视图 */}
          {currentView === 'points' && (
            <div className="points-view">
              {meetingPoints.length > 0 ? (
                <div className="points-list">
                  {meetingPoints.slice(0, 10).map((point, index) => (
                    <MeetingPointCard
                      key={point.id}
                      point={point}
                      rank={index + 1}
                      selected={selectedPoint?.id === point.id}
                      onClick={() => onSelectPoint(point)}
                      compact={true} // 紧凑模式
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FontAwesomeIcon icon={faStar} className="empty-icon" />
                  <p>暂无推荐会面点</p>
                  <small>请先添加人员并进行搜索</small>
                </div>
              )}
            </div>
          )}

          {/* 路线视图 */}
          {currentView === 'routes' && (
            <div className="routes-view">
              {routes.length > 0 ? (
                <div className="routes-list">
                  {routes.map((route, index) => (
                    <div 
                      key={index}
                      className={`route-item ${route.selected ? 'selected' : ''}`}
                      onClick={() => onSelectRoute(route)}
                    >
                      <div className="route-header">
                        <div className="transport-info">
                          <FontAwesomeIcon 
                            icon={getTransportIcon(route.mode)} 
                            className="transport-icon"
                          />
                          <span className="transport-label">
                            {getTransportLabel(route.mode)}
                          </span>
                        </div>
                        <div className="route-stats">
                          <span className="time">{route.duration}</span>
                          <span className="distance">{route.distance}</span>
                        </div>
                      </div>
                      
                      <div className="route-details">
                        <div className="person-times">
                          {route.personTimes?.map((pt, i) => (
                            <div key={i} className="person-time">
                              <span className="person-name">{pt.name}</span>
                              <span className="time-value">{pt.time}</span>
                            </div>
                          ))}
                        </div>
                        
                        {route.description && (
                          <div className="route-description">
                            {route.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FontAwesomeIcon icon={faRoute} className="empty-icon" />
                  <p>暂无路线信息</p>
                  <small>请选择一个会面点查看路线</small>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ResultsPanel;
