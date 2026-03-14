/**
 * 单终端模式页面组件（AI 对话式新版）
 * 功能：通过 AI 对话框接收自然语言需求，智能解析并执行会面点搜索
 * 布局：左侧 AI 对话框 + 右侧地图和结果展示
 */

import { useState, useCallback, useEffect } from 'react';
import MapContainer from '../Map/MapContainer';
import PersonForm from '../UserInput/PersonForm';
import PersonList from '../UserInput/PersonList';
import MeetingPointCard from '../Result/MeetingPointCard';
import { findMeetingPoint } from '../../services/api';
import amapService from '../../services/amapService';
import AiChatBox from '../Chat/AiChatBox';
import AiParserService from '../../services/aiParserService';
import './SingleTerminalPage.css';

function SingleTerminalPage() {
  // ==================== 基础状态 ====================
  // 人员列表
  const [persons, setPersons] = useState([]);
  
  // 会面点搜索结果
  const [meetingPoints, setMeetingPoints] = useState([]);
  
  // 当前选中的会面点
  const [selectedPoint, setSelectedPoint] = useState(null);
  
  // 搜索加载状态
  const [loading, setLoading] = useState(false);
  
  // 搜索错误信息
  const [error, setError] = useState(null);
  
  // 地图相关状态
  const [pendingLocation, setPendingLocation] = useState(null);
  
  // ==================== AI 对话状态 ====================
  // 对话历史
  const [conversation, setConversation] = useState([
    {
      role: 'ai',
      content: '您好！我是您的会面点规划助手。请告诉我您的会面需求，比如：\n\n• "找一个适合聚餐的地方，距离大家都不远"\n• "找个咖啡馆，步行10分钟内能到"\n• "推荐一个购物中心，交通便利的"\n\n我会自动解析您的需求并为您寻找最佳会面点！',
      timestamp: Date.now()
    }
  ]);
  
  // AI 处理状态
  const [aiProcessing, setAiProcessing] = useState(false);
  
  // 解析出的参数
  const [parsedParameters, setParsedParameters] = useState(null);
  
  // ==================== 地图交互状态 ====================
  // 人员移动状态
  const [personMoveState, setPersonMoveState] = useState({});

  // ==================== 初始化 ====================
  // 初始化时添加默认用户（当前位置）
  useEffect(() => {
    const addDefaultUser = async () => {
      try {
        await amapService.loadScript();

        // 使用 IP 定位获取当前城市和位置
        const localCity = new window.BMap.LocalCity();
        localCity.get(async (result) => {
          if (result && result.center) {
            const { lng, lat } = result.center;
            const cityName = result.name ? result.name.replace('市', '') : '未知城市';

            // 逆地理编码获取地址名称
            let locationName = cityName;
            try {
              const geocodeResult = await amapService.reverseGeocode(lng, lat);
              if (geocodeResult.surroundingPois && geocodeResult.surroundingPois.length > 0) {
                locationName = geocodeResult.surroundingPois[0].title || geocodeResult.address || cityName;
              } else if (geocodeResult.address) {
                locationName = geocodeResult.address;
              }
            } catch (e) {
              console.error('逆地理编码失败:', e);
            }

            // 添加默认用户
            setPersons([{
              id: 'person_default',
              name: '用户 1',
              lng,
              lat,
              locationName,
              city: cityName,
              transportMode: 'driving',
              departureTime: Date.now()
            }]);
          }
        });
      } catch (error) {
        console.error('初始化默认用户失败:', error);
      }
    };

    addDefaultUser();
  }, []);

  // ==================== 人员管理函数 ====================
  
  /**
   * 添加人员
   * @param {Object} person - 人员信息
   */
  const handleAddPerson = useCallback((person) => {
    setPersons(prev => {
      const nextNum = prev.length + 1;
      const name = person.name || `用户${nextNum}`;
      return [...prev, { ...person, name, id: `person_${Date.now()}` }];
    });
    
    // 清除之前的计算结果
    clearSearchResults();
  }, []);

  /**
   * 更新人员信息
   * @param {string} id - 人员ID
   * @param {Object} updatedPerson - 更新的人员信息
   */
  const handleUpdatePerson = useCallback((id, updatedPerson) => {
    setPersons(prev => prev.map(p => p.id === id ? updatedPerson : p));
    
    // 清除之前的计算结果
    clearSearchResults();
  }, []);

  /**
   * 删除人员
   * @param {string} id - 人员ID
   */
  const handleRemovePerson = useCallback((id) => {
    setPersons(prev => prev.filter(p => p.id !== id));
    
    // 清除之前的计算结果
    clearSearchResults();
  }, []);

  /**
   * 清除搜索结果
   */
  const clearSearchResults = useCallback(() => {
    setMeetingPoints([]);
    setSelectedPoint(null);
    setError(null);
  }, []);

  // ==================== 地图交互函数 ====================
  
  /**
   * 处理地图点击
   * @param {Object} location - 点击位置 {lng, lat}
   */
  const handleMapClick = useCallback((location) => {
    setPendingLocation(location);
  }, []);

  /**
   * 处理选中会面点移动
   * @param {Object} location - 新位置 {lng, lat}
   */
  const handleSelectedPointMove = useCallback((location) => {
    setSelectedPoint(prev => prev ? { ...prev, lng: location.lng, lat: location.lat } : prev);
    setMeetingPoints(prev => prev.map(p =>
      p.id === selectedPoint?.id ? { ...p, lng: location.lng, lat: location.lat } : p
    ));
  }, [selectedPoint?.id]);

  /**
   * 处理人员移动
   * @param {string} id - 人员ID
   * @param {Object} location - 新位置 {lng, lat}
   */
  const handlePersonMove = useCallback((id, location) => {
    setPersons(prev => prev.map(p => p.id === id ? { ...p, lng: location.lng, lat: location.lat } : p));
    setMeetingPoints([]);
    setSelectedPoint(null);
    setError(null);
  }, []);

  /**
   * 清除待处理位置
   */
  const handleClearPending = useCallback(() => {
    setPendingLocation(null);
  }, []);

  // ==================== AI 对话处理函数 ====================
  
  /**
   * 处理用户发送消息
   * @param {string} message - 用户输入的消息
   */
  const handleSendMessage = useCallback(async (message) => {
    // 添加用户消息到对话历史
    setConversation(prev => [
      ...prev,
      {
        role: 'user',
        content: message,
        timestamp: Date.now()
      }
    ]);

    setAiProcessing(true);
    setError(null);

    try {
      // 1. AI 解析用户需求
      const parsedResult = AiParserService.parseUserInput(message);
      
      // 2. 验证解析结果
      const validation = AiParserService.validateResult(parsedResult);
      if (!validation.isValid) {
        throw new Error(`解析失败: ${validation.errors.join(', ')}`);
      }

      // 3. 设置解析出的参数
      setParsedParameters(parsedResult);

      // 4. 生成 AI 回复
      const aiResponse = AiParserService.generateAiResponse(parsedResult);
      
      // 5. 添加 AI 回复到对话历史
      setConversation(prev => [
        ...prev,
        {
          role: 'ai',
          content: aiResponse,
          timestamp: Date.now(),
          parsedParams: parsedResult
        }
      ]);

      // 6. 如果人员数量足够，自动执行搜索
      if (persons.length >= 2) {
        await executeSearch(parsedResult);
      } else {
        // 人员不足，提示用户添加更多人员
        setTimeout(() => {
          setConversation(prev => [
            ...prev,
            {
              role: 'ai',
              content: '💡 提示：请至少添加 2 位参与人员，我才能为您计算最佳会面点哦！',
              timestamp: Date.now()
            }
          ]);
        }, 1000);
      }

    } catch (err) {
      console.error('AI 处理失败:', err);
      setError(err.message || 'AI 处理失败，请重试');
      
      // 添加错误消息到对话历史
      setConversation(prev => [
        ...prev,
        {
          role: 'ai',
          content: `❌ 抱歉，处理您的需求时出现错误：${err.message}`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setAiProcessing(false);
    }
  }, [persons.length]);

  /**
   * 执行会面点搜索
   * @param {Object} parsedParams - 解析出的参数
   */
  const executeSearch = async (parsedParams) => {
    if (persons.length < 2) {
      throw new Error('至少需要 2 个人才能计算会面点');
    }

    setLoading(true);
    setError(null);
    setMeetingPoints([]);
    setSelectedPoint(null);

    try {
      // 转换为 API 参数
      const apiParams = AiParserService.convertToApiParams(parsedParams);
      
      // 执行搜索
      const result = await findMeetingPoint(persons, apiParams);

      if (result.success && result.data.meetingPoints.length > 0) {
        setMeetingPoints(result.data.meetingPoints);
        setSelectedPoint(result.data.meetingPoints[0]);
        
        // 添加成功消息到对话历史
        setConversation(prev => [
          ...prev,
          {
            role: 'ai',
            content: `✅ 搜索完成！为您找到 ${result.data.meetingPoints.length} 个推荐会面点。\n\n${parsedParams.summary}`,
            timestamp: Date.now()
          }
        ]);
      } else {
        throw new Error('未找到合适的会面点，请调整搜索条件');
      }
    } catch (err) {
      console.error('搜索失败:', err);
      const errorMsg = err.response?.data?.error || err.message || '搜索失败，请检查网络连接';
      setError(errorMsg);
      
      // 添加错误消息到对话历史
      setConversation(prev => [
        ...prev,
        {
          role: 'ai',
          content: `❌ 搜索失败：${errorMsg}`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 清除所有数据
   */
  const handleClearAll = useCallback(() => {
    setPersons([]);
    setMeetingPoints([]);
    setSelectedPoint(null);
    setError(null);
    setParsedParameters(null);
    
    // 重置对话历史
    setConversation([
      {
        role: 'ai',
        content: '您好！我是您的会面点规划助手。请告诉我您的会面需求...',
        timestamp: Date.now()
      }
    ]);
  }, []);

  // ==================== 渲染 ====================
  return (
    <div className="single-terminal-page ai-conversation-layout">
      {/* 左侧 AI 对话区域 */}
      <div className="left-panel">
        <div className="panel-header">
          <h2>会面点智能规划</h2>
          <p>AI 对话式交互，自然语言规划</p>
        </div>
        
        <div className="panel-content">
          {/* 人员管理区域 */}
          <div className="person-management-section">
            <div className="section-header">
              <h3>👥 参与人员 ({persons.length})</h3>
              {persons.length > 0 && (
                <button className="clear-btn" onClick={handleClearAll}>
                  清空
                </button>
              )}
            </div>
            
            {/* 添加人员表单 */}
            <PersonForm
              onAdd={handleAddPerson}
              pendingLocation={pendingLocation}
              onClearPending={handleClearPending}
            />
            
            {/* 人员列表 */}
            <PersonList
              persons={persons}
              onRemove={handleRemovePerson}
              onUpdate={handleUpdatePerson}
            />
          </div>
          
          {/* AI 对话框 */}
          <div className="ai-chat-section">
            <AiChatBox
              conversation={conversation}
              onSendMessage={handleSendMessage}
              isLoading={aiProcessing || loading}
              onParametersParsed={setParsedParameters}
            />
          </div>
        </div>
      </div>

      {/* 右侧地图和结果区域 */}
      <div className="right-panel">
        <div className="map-area">
          <MapContainer
            persons={persons}
            meetingPoints={meetingPoints}
            selectedPoint={selectedPoint}
            onMapClick={handleMapClick}
            onSelectedPointMove={handleSelectedPointMove}
            onPersonMove={handlePersonMove}
          />

          {/* 提示信息 */}
          {persons.length === 0 && (
            <div className="map-hint">
              点击地图选择位置，或在左侧搜索地址
            </div>
          )}
          
          {persons.length > 0 && persons.length < 2 && (
            <div className="map-hint warning">
              请至少添加 2 位参与人员
            </div>
          )}
        </div>

        {/* 结果展示区域（仅在有结果时显示） */}
        {meetingPoints.length > 0 && (
          <div className="results-section">
            <div className="section-header">
              <h3>🏆 Top {Math.min(5, meetingPoints.length)} 推荐会面点</h3>
            </div>
            <div className="results-list">
              {meetingPoints.slice(0, 5).map((point, index) => (
                <MeetingPointCard
                  key={point.id}
                  point={point}
                  rank={index + 1}
                  selected={selectedPoint?.id === point.id}
                  onClick={() => setSelectedPoint(point)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default SingleTerminalPage;
