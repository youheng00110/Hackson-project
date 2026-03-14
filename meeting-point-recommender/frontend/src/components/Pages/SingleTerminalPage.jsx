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
import ResultsPanel from '../Result/ResultsPanel';
import EnhancedAiDecisionService from '../../services/enhancedAiDecisionService';
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
  
  // 人员管理区域折叠状态
  const [isPersonSectionCollapsed, setIsPersonSectionCollapsed] = useState(false); // 默认展开
  
  // AI 聊天区域折叠状态（与人员区域相反）
  const [isChatSectionCollapsed, setIsChatSectionCollapsed] = useState(true); // 默认折叠
  
  // 右侧结果面板状态
  const [isResultsPanelOpen, setIsResultsPanelOpen] = useState(false);
  
  // 路线数据
  const [routes, setRoutes] = useState([]);
  
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
    setRoutes([]);
    setIsResultsPanelOpen(false);
  }, []);

  /**
   * 处理会面点选择
   * @param {Object} point - 选中的会面点
   */
  const handleSelectPoint = useCallback((point) => {
    setSelectedPoint(point);
    
    // 生成模拟路线数据
    const mockRoutes = persons.map((person, index) => ({
      id: `route_${index}`,
      mode: person.transportMode || 'driving',
      duration: `${10 + index * 5}分钟`,
      distance: `${1.2 + index * 0.3}公里`,
      personTimes: [
        {
          name: person.name,
          time: `${10 + index * 5}分钟`
        }
      ],
      description: `从${person.locationName || '起点'}到${point.name}的最佳路线`,
      selected: index === 0
    }));
    
    setRoutes(mockRoutes);
  }, [persons]);

  /**
   * 处理路线选择
   * @param {Object} route - 选中的路线
   */
  const handleSelectRoute = useCallback((route) => {
    setRoutes(prev => prev.map(r => ({
      ...r,
      selected: r.id === route.id
    })));
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
    // 更新选中的点
    setSelectedPoint(prev => {
      if (!prev) return prev;
      const updated = { ...prev, lng: location.lng, lat: location.lat };
      
      // 同时更新候选点列表中的对应点
      setMeetingPoints(points => points.map(p =>
        p.id === prev.id ? { ...p, lng: location.lng, lat: location.lat } : p
      ));
      
      return updated;
    });
  }, []);

  /**
   * 处理人员移动
   * @param {string} id - 人员ID
   * @param {Object} location - 新位置 {lng, lat}
   */
  const handlePersonMove = useCallback(async (id, location) => {
    try {
      // 逆地理编码获取新地址名称
      const geocodeResult = await amapService.reverseGeocode(location.lng, location.lat);
      let newLocationName = '未知位置';
      
      if (geocodeResult.surroundingPois && geocodeResult.surroundingPois.length > 0) {
        newLocationName = geocodeResult.surroundingPois[0].title;
      } else if (geocodeResult.address) {
        newLocationName = geocodeResult.address;
      }
      
      // 更新人员信息
      setPersons(prev => prev.map(p => 
        p.id === id 
          ? { ...p, lng: location.lng, lat: location.lat, locationName: newLocationName }
          : p
      ));
      
      // 清除之前的计算结果
      clearSearchResults();
      
    } catch (error) {
      console.error('更新人员位置失败:', error);
      // 即使逆地理编码失败，也更新坐标
      setPersons(prev => prev.map(p => 
        p.id === id 
          ? { ...p, lng: location.lng, lat: location.lat }
          : p
      ));
      clearSearchResults();
    }
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
      
      // 重要：保留每个人自己设置的交通方式（优先级高于 AI 解析）
      // 只有当某个人没有设置交通方式时，才使用 AI 解析的默认值
      const personsWithTransport = persons.map(person => ({
        ...person,
        transportMode: person.transportMode || parsedParams.transportMode || 'driving'
      }));
      
      // 执行搜索（使用更新后的交通方式）
      const result = await findMeetingPoint(personsWithTransport, apiParams);

      console.log('🔍 [API 返回结果]', {
        success: result.success,
        meetingPointsLength: result.data?.meetingPoints?.length,
        actualCount: result.data?.actualCount,
        searchedCount: result.data?.searchedCount,
        hasData: !!result.data,
        firstMeetingPoint: result.data?.meetingPoints?.[0]
      });

      // 检查有效候选点数量，如果不足 5 个则主动抛出错误
      if (result.success && result.data.meetingPoints.length > 0) {
        const { actualCount, searchedCount } = result.data;
        console.log('✅ 后端返回数据:', {
          meetingPointsLength: result.data.meetingPoints.length,
          actualCount,
          searchedCount
        });
        
        if (actualCount < 5) {
          throw new Error(`只找到 ${actualCount} 个有效会面点（原始搜索到${searchedCount}个候选点，但大部分无法计算路线）。建议：1) 扩大搜索范围；2) 更换其他区域；3) 尝试不同的场所类型。`);
        }
        
        // 使用增强 AI 决策服务生成推荐说明和排序
        const { rankedCandidates, originalCandidates } = EnhancedAiDecisionService.generateEnhancedRecommendations(
          result.data.meetingPoints,
          persons
        );
        
        // 右侧面板显示原始顺序（保持后端返回的 POI 列表）
        setMeetingPoints(originalCandidates);
        setSelectedPoint(originalCandidates[0]);
        setIsResultsPanelOpen(true); // 自动打开结果面板
        
        // 在聊天框中输出 AI 推荐的 Top 3（按综合评分排序）
        const top3Ranked = rankedCandidates.slice(0, 3);
        let recommendationMessage = `✅ 搜索完成！为您找到 ${rankedCandidates.length} 个推荐会面点。

${parsedParams.summary}

`;
        
        // 🌟 AI 精选推荐（按综合评分排序）
        recommendationMessage += '🤖 AI 综合评估维度：交通便利、天气适配、设施配套、口碑评价、停车便利\n\n';
        recommendationMessage += '🌟 AI 精选 Top 3 推荐：\n\n';
        
        top3Ranked.forEach((candidate, index) => {
          const rankEmoji = ['🥇', '🥈', '🥉'][index];
          recommendationMessage += `${rankEmoji}【第${index + 1}名】${candidate.name}\n`;
          recommendationMessage += `   综合评分：${Math.round(candidate.enhancedScores.total)}分\n`;
          
          // 突出最强优势
          const scores = [
            { name: '交通', score: candidate.enhancedScores.traffic },
            { name: '天气', score: candidate.enhancedScores.weather },
            { name: '设施', score: candidate.enhancedScores.facilities },
            { name: '口碑', score: candidate.enhancedScores.reputation },
            { name: '停车', score: candidate.enhancedScores.parking }
          ];
          const bestScore = scores.reduce((prev, curr) => curr.score > prev.score ? curr : prev);
          
          recommendationMessage += `   ⭐ 突出优势：${bestScore.name} (${Math.round(bestScore.score)}分)\n\n`;
          
          // 推荐说明
          recommendationMessage += candidate.recommendation || '';
          recommendationMessage += '\n\n';
        });
        
        recommendationMessage += '💡 提示：右侧面板展示所有候选点（按距离排序），您可以点击查看详情并规划路线。';
        
        setConversation(prev => [
          ...prev,
          {
            role: 'ai',
            content: recommendationMessage,
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
      
      // 如果是"未找到 POI"或"有效候选点不足"的错误，自动扩大搜索范围重试
      if (errorMsg.includes('未找到任何合适的会面地点') || errorMsg.includes('只找到')) {
        // 检查重试次数
        const retryCount = parsedParams.retryCount || 0;
        const maxRetries = 3; // 最多重试 3 次
        
        if (retryCount >= maxRetries) {
          // 超过最大重试次数，停止自动重试
          setConversation(prev => [
            ...prev,
            {
              role: 'ai',
              content: `⚠️ 已尝试扩大搜索范围 ${maxRetries} 次（当前半径：${parsedParams.radius}米），但仍然未找到足够的会面点。建议：\n1. 更换其他区域试试\n2. 调整参与人员的位置\n3. 选择不同的场所类型`,
              timestamp: Date.now()
            }
          ]);
          return; // 停止重试
        }
        
        setTimeout(() => {
          const newRadius = Math.min(parsedParams.radius * 2, 10000); // 最大扩大到 10 公里
          
          setConversation(prev => [
            ...prev,
            {
              role: 'ai',
              content: `🤖 检测到当前位置周围场所较少或路线计算困难，我将为您扩大搜索范围重新尝试...（第 ${retryCount + 1}/${maxRetries} 次，半径：${newRadius}米）`,
              timestamp: Date.now()
            }
          ]);
                
          // 自动扩大搜索半径并重新搜索，增加重试计数
          const expandedParams = {
            ...parsedParams,
            radius: newRadius,
            retryCount: retryCount + 1 // 记录重试次数
          };
          executeSearch(expandedParams);
        }, 1500);
      }
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
          {/* 参与人员板块 - 严格互斥逻辑 */}
          <div 
            className={`participant-section ${isPersonSectionCollapsed ? 'collapsed' : 'expanded'}`}
            onClick={(e) => {
              e.stopPropagation();
              // 点击人员区域：展开人员，收起 AI
              if (isPersonSectionCollapsed) {
                setIsPersonSectionCollapsed(false);
                setIsChatSectionCollapsed(true);
              }
            }}
          >
            <div className="section-header">
              <h3>
                👥 参与人员 ({persons.length})
                <button 
                  className="toggle-arrow"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 箭头按钮：切换人员区域状态
                    const newState = !isPersonSectionCollapsed;
                    setIsPersonSectionCollapsed(newState);
                    if (newState) {
                      // 收起人员时，AI 保持当前状态或展开
                      if (isChatSectionCollapsed) {
                        setIsChatSectionCollapsed(false);
                      }
                    } else {
                      // 展开人员时，收起 AI
                      setIsChatSectionCollapsed(true);
                    }
                  }}
                >
                  {isPersonSectionCollapsed ? '▶' : '▼'}
                </button>
              </h3>
              
              {!isPersonSectionCollapsed && persons.length > 0 && (
                <button 
                  className="clear-all-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearAll();
                  }}
                >
                  清空
                </button>
              )}
            </div>
            
            {!isPersonSectionCollapsed && (
              <div className="participant-content">
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
            )}
          </div>

          {/* AI 助手板块 - 严格互斥逻辑 */}
          <div 
            className={`ai-assistant-section ${isChatSectionCollapsed ? 'collapsed' : 'expanded'}`}
            onClick={() => {
              // 点击 AI 区域（除人员区域外的所有地方）：展开 AI，收起人员
              if (isChatSectionCollapsed) {
                setIsChatSectionCollapsed(false);
                setIsPersonSectionCollapsed(true);
              }
            }}
          >
            <div className="section-header">
              <h3>
                🤖 AI 助手
                <button 
                  className="toggle-arrow"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 箭头按钮：切换 AI 区域状态
                    const newState = !isChatSectionCollapsed;
                    setIsChatSectionCollapsed(newState);
                    if (newState) {
                      // 收起 AI 时，人员保持当前状态或展开
                      if (isPersonSectionCollapsed) {
                        setIsPersonSectionCollapsed(false);
                      }
                    } else {
                      // 展开 AI 时，收起人员
                      setIsPersonSectionCollapsed(true);
                    }
                  }}
                >
                  {isChatSectionCollapsed ? '▶' : '▼'}
                </button>
              </h3>
            </div>
            
            {!isChatSectionCollapsed && (
              <div className="ai-content">
                <AiChatBox
                  conversation={conversation}
                  onSendMessage={handleSendMessage}
                  isLoading={aiProcessing || loading}
                  onParametersParsed={setParsedParameters}
                />
              </div>
            )}
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

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* 右侧结果面板 */}
        <ResultsPanel
          isOpen={isResultsPanelOpen}
          onToggle={() => setIsResultsPanelOpen(!isResultsPanelOpen)}
          meetingPoints={meetingPoints}
          selectedPoint={selectedPoint}
          onSelectPoint={handleSelectPoint}
          routes={routes}
          onSelectRoute={handleSelectRoute}
        />
      </div>
    </div>
  );
}

export default SingleTerminalPage;
