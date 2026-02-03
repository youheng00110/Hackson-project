/**
 * 多人会面点推荐系统 - 主应用组件
 */

import { useState, useCallback, useEffect } from 'react';
import MapContainer from './components/Map/MapContainer';
import PersonForm from './components/UserInput/PersonForm';
import PersonList from './components/UserInput/PersonList';
import MeetingPointCard from './components/Result/MeetingPointCard';
import { findMeetingPoint } from './services/api';
import amapService from './services/amapService';
import './App.css';

// 会面点类型选项
const PLACE_TYPES = [
  { id: 'cafe', label: '咖啡馆', keywords: ['咖啡', '咖啡厅', '咖啡馆'] },
  { id: 'park', label: '公园', keywords: ['公园', '绿地', '广场'] },
  { id: 'restaurant', label: '餐厅', keywords: ['餐厅', '餐饮', '美食'] },
  { id: 'mall', label: '商场', keywords: ['购物中心', '商场', '百货'] },
  { id: 'library', label: '图书馆', keywords: ['图书馆', '阅读'] },
  { id: 'cinema', label: '电影院', keywords: ['电影院', '影城'] }
];

function App() {
  // 状态
  const [persons, setPersons] = useState([]);
  const [meetingPoints, setMeetingPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [selectedPlaceTypes, setSelectedPlaceTypes] = useState([]);
  const [customPlaceType, setCustomPlaceType] = useState('');
  const [customPlaceTypes, setCustomPlaceTypes] = useState([]);

  // 初始化时添加默认用户（当前位置）
  useEffect(() => {
    const addDefaultUser = async () => {
      try {
        await amapService.loadScript();

        // 使用IP定位获取当前城市和位置
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
              name: '用户1',
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

  // 添加人员
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

  // 更新人员
  const handleUpdatePerson = useCallback((id, updatedPerson) => {
    setPersons(prev => prev.map(p => p.id === id ? updatedPerson : p));
    // 清除之前的计算结果
    setMeetingPoints([]);
    setSelectedPoint(null);
  }, []);

  // 删除人员
  const handleRemovePerson = useCallback((id) => {
    setPersons(prev => prev.filter(p => p.id !== id));
    // 清除之前的计算结果
    setMeetingPoints([]);
    setSelectedPoint(null);
  }, []);

  // 地图点击
  const handleMapClick = useCallback((location) => {
    setPendingLocation(location);
  }, []);

  // 清除待处理位置
  const handleClearPending = useCallback(() => {
    setPendingLocation(null);
  }, []);

  // 切换会面点类型
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

  // 添加自定义类型
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

  // 删除自定义类型
  const handleRemoveCustomType = useCallback((type) => {
    setCustomPlaceTypes(prev => prev.filter(t => t !== type));
    // 清除之前的计算结果
    setMeetingPoints([]);
    setSelectedPoint(null);
  }, []);

  // 查找会面点
  const handleFindMeetingPoint = async () => {
    if (persons.length < 2) {
      setError('至少需要2个人才能计算会面点');
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
      const result = await findMeetingPoint(persons, { poiTypes });

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

  // 清除所有
  const handleClearAll = () => {
    setPersons([]);
    setMeetingPoints([]);
    setSelectedPoint(null);
    setError(null);
  };

  return (
    <div className="app">
      {/* 左侧边栏 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>多人会面点推荐</h1>
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

          {/* 结果展示 */}
          {meetingPoints.length > 0 && (
            <div className="section results-section">
              <h2>推荐会面点</h2>
              <div className="results-list">
                {meetingPoints.map((point, index) => (
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
        </div>
      </div>

      {/* 右侧地图 */}
      <div className="main-content">
        <MapContainer
          persons={persons}
          meetingPoints={meetingPoints}
          selectedPoint={selectedPoint}
          onMapClick={handleMapClick}
        />

        {/* 提示信息 */}
        {persons.length === 0 && (
          <div className="map-hint">
            点击地图选择位置，或在左侧搜索地址
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
