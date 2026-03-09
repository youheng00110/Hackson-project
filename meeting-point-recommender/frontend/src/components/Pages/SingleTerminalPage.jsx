/**
 * 单终端模式页面组件
 * 功能：保留原有单终端模式的所有功能和布局
 * 说明：这是原有的 App.jsx 改造而来，保持所有原有逻辑不变
 */

import { useState, useCallback, useEffect } from 'react';
import MapContainer from '../Map/MapContainer';
import PersonForm from '../UserInput/PersonForm';
import PersonList from '../UserInput/PersonList';
import MeetingPointCard from '../Result/MeetingPointCard';
import AiDecisionCard from '../Result/AiDecisionCard';
import { findMeetingPoint, aiAutoDecision } from '../../services/api';
import amapService from '../../services/amapService';
import './SingleTerminalPage.css';

// 会面点类型选项（保持不变）
const PLACE_TYPES = [
  { id: 'cafe', label: '咖啡馆', keywords: ['咖啡', '咖啡厅', '咖啡馆'] },
  { id: 'park', label: '公园', keywords: ['公园', '绿地', '广场'] },
  { id: 'restaurant', label: '美食', keywords: ['美食', '餐厅', '餐饮'] },
  { id: 'mall', label: '购物中心', keywords: ['购物中心', '商场', '百货'] },
  { id: 'library', label: '图书馆', keywords: ['图书馆', '阅读'] },
  { id: 'cinema', label: '电影院', keywords: ['电影院', '影城'] }
];

/**
 * 单终端模式页面组件
 */
function SingleTerminalPage() {
  // 状态（保持原有所有状态）
  const [persons, setPersons] = useState([]);
  const [meetingPoints, setMeetingPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [selectedPlaceTypes, setSelectedPlaceTypes] = useState([]);
  const [customPlaceType, setCustomPlaceType] = useState('');
  const [customPlaceTypes, setCustomPlaceTypes] = useState([]);
  const [searchRadius, setSearchRadius] = useState(3000);
  const [objective, setObjective] = useState('balanced');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

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

  // 添加人员（保持不变）
  const handleAddPerson = useCallback((person) => {
    setPersons(prev => {
      const nextNum = prev.length + 1;
      const name = person.name || `用户${nextNum}`;
      return [...prev, { ...person, name, id: `person_${Date.now()}` }];
    });
    // 清除之前的计算结果
    setMeetingPoints([]);
    setSelectedPoint(null);
    setError(null);
  }, []);

  // 更新人员（保持不变）
  const handleUpdatePerson = useCallback((id, updatedPerson) => {
    setPersons(prev => prev.map(p => p.id === id ? updatedPerson : p));
    // 清除之前的计算结果
    setMeetingPoints([]);
    setSelectedPoint(null);
  }, []);

  // 删除人员（保持不变）
  const handleRemovePerson = useCallback((id) => {
    setPersons(prev => prev.filter(p => p.id !== id));
    // 清除之前的计算结果
    setMeetingPoints([]);
    setSelectedPoint(null);
  }, []);

  // 地图点击（保持不变）
  const handleMapClick = useCallback((location) => {
    setPendingLocation(location);
  }, []);

  // 拖拽更新选中会面点（保持不变）
  const handleSelectedPointMove = useCallback((location) => {
    setSelectedPoint(prev => prev ? { ...prev, lng: location.lng, lat: location.lat } : prev);
    setMeetingPoints(prev => prev.map(p =>
      p.id === selectedPoint?.id ? { ...p, lng: location.lng, lat: location.lat } : p
    ));
  }, [selectedPoint?.id]);

  const handlePersonMove = useCallback((id, location) => {
    setPersons(prev => prev.map(p => p.id === id ? { ...p, lng: location.lng, lat: location.lat } : p));
    setMeetingPoints([]);
    setSelectedPoint(null);
    setError(null);
  }, []);

  // 清除待处理位置（保持不变）
  const handleClearPending = useCallback(() => {
    setPendingLocation(null);
  }, []);

  // 切换会面点类型（保持不变）
  const handleTogglePlaceType = useCallback((typeId) => {
    setSelectedPlaceTypes(prev => {
      if (prev.includes(typeId)) {
        return prev.filter(t => t !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
    // 清除之前的计算结果
    setMeetingPoints([]);
    setSelectedPoint(null);
  }, []);

  // 添加自定义类型（保持不变）
  const handleAddCustomType = useCallback(() => {
    const trimmed = customPlaceType.trim();
    if (trimmed && !customPlaceTypes.includes(trimmed)) {
      setCustomPlaceTypes(prev => [...prev, trimmed]);
      setCustomPlaceType('');
      // 清除之前的计算结果
      setMeetingPoints([]);
      setSelectedPoint(null);
    }
  }, [customPlaceType, customPlaceTypes]);

  // 删除自定义类型（保持不变）
  const handleRemoveCustomType = useCallback((type) => {
    setCustomPlaceTypes(prev => prev.filter(t => t !== type));
    // 清除之前的计算结果
    setMeetingPoints([]);
    setSelectedPoint(null);
  }, []);

  // 查找会面点（保持不变）
  const handleFindMeetingPoint = async () => {
    if (persons.length < 2) {
      setError('至少需要 2 个人才能计算会面点');
      return;
    }

    setLoading(true);
    setError(null);
    setMeetingPoints([]);
    setSelectedPoint(null);

    // 根据选择的类型生成关键词
    const poiTypes = [
      ...selectedPlaceTypes.flatMap(typeId => {
        const type = PLACE_TYPES.find(t => t.id === typeId);
        return type ? type.keywords : [];
      }),
      ...customPlaceTypes
    ];

    try {
      const result = await findMeetingPoint(persons, { poiTypes, searchRadius, objective });

      if (result.success && result.data.meetingPoints.length > 0) {
        setMeetingPoints(result.data.meetingPoints);
        setSelectedPoint(result.data.meetingPoints[0]);
      } else {
        setError('未找到合适的会面点，请检查位置信息');
      }
    } catch (err) {
      console.error('计算失败:', err);
      setError(err.response?.data?.error || '计算失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // AI 决策（保持不变）
  const handleAiDecision = async () => {
    if (persons.length < 2) {
      setAiError('请先添加至少 2 人');
      return;
    }

    if (meetingPoints.length === 0) {
      setAiError('请先生成候选会面点');
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiOutput('');

    try {
      const city = persons[0]?.city || '北京';
      const participants = persons.map(p => ({
        lng: p.lng,
        lat: p.lat,
        transportMode: p.transportMode,
        city: p.city
      }));
      const candidates = meetingPoints.map(p => ({
        name: p.name || '候选点',
        lng: p.lng,
        lat: p.lat
      }));

      const result = await aiAutoDecision({ city, participants, candidates });
      if (result.success) {
        if (typeof result.data === 'string') {
          setAiOutput(result.data);
        } else {
          setAiOutput(result.data?.text || '');
        }
      } else {
        setAiError(result.error || 'AI 决策失败');
      }
    } catch (err) {
      console.error('AI 决策失败:', err);
      setAiError(err.response?.data?.error || 'AI 决策失败');
    } finally {
      setAiLoading(false);
    }
  };

  // 清除所有（保持不变）
  const handleClearAll = () => {
    setPersons([]);
    setMeetingPoints([]);
    setSelectedPoint(null);
    setError(null);
  };

  // 渲染（保持原有布局和逻辑，仅移除 sidebar）
  return (
    <div className="single-terminal-page">
      {/* 左侧功能区 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>单人终端模式</h1>
          <p className="subtitle">智能推荐最佳会面地点</p>
        </div>

        <div className="sidebar-content">
          {/* 人员表单 */}
          <div className="section">
            <h2>添加人员</h2>
            <PersonForm
              onAdd={handleAddPerson}
              pendingLocation={pendingLocation}
              onClearPending={handleClearPending}
            />
          </div>

          {/* 人员列表 */}
          <div className="section">
            <div className="section-header">
              <h2>人员列表 ({persons.length})</h2>
              {persons.length > 0 && (
                <button className="clear-btn" onClick={handleClearAll}>
                  清空
                </button>
              )}
            </div>
            <PersonList
              persons={persons}
              onRemove={handleRemovePerson}
              onUpdate={handleUpdatePerson}
            />
          </div>

          {/* 会面点类型选择 */}
          <div className="section">
            <h2>会面点类型</h2>
            <div className="place-type-selector">
              {PLACE_TYPES.map(type => (
                <button
                  key={type.id}
                  className={`place-type-btn ${selectedPlaceTypes.includes(type.id) ? 'selected' : ''}`}
                  onClick={() => handleTogglePlaceType(type.id)}
                >
                  {type.label}
                </button>
              ))}
              {customPlaceTypes.map(type => (
                <button
                  key={type}
                  className="place-type-btn selected custom"
                  onClick={() => handleRemoveCustomType(type)}
                  title="点击删除"
                >
                  {type} x
                </button>
              ))}
            </div>
            <div className="custom-type-input">
              <input
                type="text"
                placeholder="输入自定义类型，如：书店"
                value={customPlaceType}
                onChange={(e) => setCustomPlaceType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomType()}
              />
              <button
                className="add-type-btn"
                onClick={handleAddCustomType}
                disabled={!customPlaceType.trim()}
              >
                添加
              </button>
            </div>
          </div>

          {/* 搜索半径 */}
          <div className="section">
            <h2>搜索半径</h2>
            <div className="radius-control">
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
              />
              <span className="radius-value">{searchRadius} 米</span>
            </div>
          </div>

          {/* 计算策略 */}
          <div className="section">
            <h2>计算策略</h2>
            <div className="strategy-control">
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              >
                <option value="balanced">默认推荐（综合）</option>
                <option value="time_gap">相对时差最小优先</option>
                <option value="distance_gap">相对距离差最小优先</option>
              </select>
            </div>
          </div>

          {/* 计算按钮 */}
          <button
            className="find-button"
            onClick={handleFindMeetingPoint}
            disabled={persons.length < 2 || loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                计算中...
              </>
            ) : (
              <>查找会面点</>
            )}
          </button>

          {/* 错误提示 */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

        </div>
      </div>

      {/* 右侧地图和结果区 */}
      <div className="main-content">
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
        </div>

        <div className="right-panel">
          {/* 结果展示 */}
          {meetingPoints.length > 0 && (
            <div className="section results-section">
              <h2>Top 5 推荐会面点</h2>
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

          {/* AI 决策助手 */}
          <div className="section">
            <h2>AI 决策助手</h2>
            <button
              className="ai-button"
              onClick={handleAiDecision}
              disabled={aiLoading}
            >
              {aiLoading ? '生成中...' : 'AI 自动决策'}
            </button>
            {aiError && <div className="error-message">{aiError}</div>}
            {aiOutput && (
              <AiDecisionCard content={aiOutput} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SingleTerminalPage;
