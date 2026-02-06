/**
 * 人员输入表单组件
 */

import { useState, useEffect, useRef } from 'react';
import amapService from '../../services/amapService';
import './PersonForm.css';

const TRANSPORT_MODES = [
    { value: 'walking', label: '步行' },
    { value: 'bicycling', label: '骑行' },
    { value: 'public_transport', label: '公共交通' },
    { value: 'driving', label: '驾车' }
];

// 常用城市列表
const POPULAR_CITIES = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'
];

function PersonForm({ onAdd, pendingLocation, onClearPending }) {
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [locationText, setLocationText] = useState('');
    const [coordinates, setCoordinates] = useState(null);
    const [transportMode, setTransportMode] = useState('driving');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const searchTimeoutRef = useRef(null);
    const cityDropdownRef = useRef(null);

    // 使用IP定位获取当前城市
    const locateByIP = async () => {
        setIsLocating(true);
        try {
            await amapService.loadScript();

            const localCity = new window.BMap.LocalCity();
            localCity.get((result) => {
                if (result && result.name) {
                    const cityName = result.name.replace('市', '');
                    setCity(cityName);
                }
                setIsLocating(false);
            });
        } catch (error) {
            console.error('IP定位失败:', error);
            setCity('北京');
            setIsLocating(false);
        }
    };

    // 初始化时获取当前城市
    useEffect(() => {
        locateByIP();
    }, []);

    // 处理地图点击位置
    useEffect(() => {
        if (pendingLocation) {
            setCoordinates(pendingLocation);
            setSearchResults([]);

            // 调用逆地理编码获取中文地址
            const fetchAddress = async () => {
                try {
                    const result = await amapService.reverseGeocode(pendingLocation.lng, pendingLocation.lat);
                    if (result.surroundingPois && result.surroundingPois.length > 0) {
                        setLocationText(result.surroundingPois[0].title || result.address);
                    } else {
                        setLocationText(result.address || `${pendingLocation.lng.toFixed(6)}, ${pendingLocation.lat.toFixed(6)}`);
                    }
                    if (result.addressComponents && result.addressComponents.city) {
                        const cityName = result.addressComponents.city.replace('市', '');
                        setCity(cityName);
                    }
                } catch (error) {
                    console.error('逆地理编码失败:', error);
                    setLocationText(`${pendingLocation.lng.toFixed(6)}, ${pendingLocation.lat.toFixed(6)}`);
                }
            };

            fetchAddress();

            if (onClearPending) {
                onClearPending();
            }
        }
    }, [pendingLocation, onClearPending]);

    // 点击外部关闭城市下拉框
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
                setShowCityDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 选择城市
    const handleSelectCity = (selectedCity) => {
        setCity(selectedCity);
        setShowCityDropdown(false);
        setSearchResults([]);
    };

    // 地点搜索
    const handleLocationSearch = async (keyword) => {
        setLocationText(keyword);
        setCoordinates(null);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (keyword.length < 2) {
            setSearchResults([]);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await amapService.searchPlace(keyword, city || '北京');
                setSearchResults(results);
            } catch (error) {
                console.error('搜索失败:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    // 选择搜索结果
    const handleSelectLocation = (result) => {
        setLocationText(result.name);
        setCoordinates({ lng: result.lng, lat: result.lat });
        setSearchResults([]);
    };

    // 提交表单
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!coordinates) {
            alert('请选择位置');
            return;
        }

        onAdd({
            name: name || '',
            lng: coordinates.lng,
            lat: coordinates.lat,
            locationName: locationText,
            city: city,
            transportMode,
            departureTime: Date.now()
        });

        // 重置表单（保留城市）
        setName('');
        setLocationText('');
        setCoordinates(null);
        setSearchResults([]);
    };

    return (
        <form className="person-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label>姓名</label>
                <input
                    type="text"
                    placeholder="输入姓名（可选）"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>位置</label>
                <div className="location-with-city">
                    {/* 城市选择器作为位置输入的前缀 */}
                    <div className="city-prefix" ref={cityDropdownRef}>
                        <button
                            type="button"
                            className="city-btn"
                            onClick={() => setShowCityDropdown(!showCityDropdown)}
                        >
                            {isLocating ? '定位...' : (city || '城市')}
                            <span className="city-arrow">▼</span>
                        </button>
                        {showCityDropdown && (
                            <ul className="city-dropdown">
                                <li
                                    className="refresh-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        locateByIP();
                                        setShowCityDropdown(false);
                                    }}
                                >
                                    ↻ 重新定位
                                </li>
                                {POPULAR_CITIES.map((c) => (
                                    <li
                                        key={c}
                                        onClick={() => handleSelectCity(c)}
                                        className={c === city ? 'selected' : ''}
                                    >
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* 位置搜索输入 */}
                    <div className="location-input-wrapper">
                        <input
                            type="text"
                            placeholder="搜索地址或点击地图选择"
                            value={locationText}
                            onChange={(e) => handleLocationSearch(e.target.value)}
                        />
                        {isSearching && <span className="searching-indicator">搜索中...</span>}

                        {searchResults.length > 0 && (
                            <ul className="search-results">
                                {searchResults.map((result) => (
                                    <li
                                        key={result.id}
                                        onClick={() => handleSelectLocation(result)}
                                    >
                                        <div className="result-name">{result.name}</div>
                                        <div className="result-address">{result.address}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                {coordinates && (
                    <div className="coordinates-display">
                        {coordinates.lng.toFixed(4)}, {coordinates.lat.toFixed(4)}
                    </div>
                )}
            </div>

            <div className="form-group">
                <label>出行方式</label>
                <div className="transport-selector">
                    {TRANSPORT_MODES.map((mode) => (
                        <button
                            key={mode.value}
                            type="button"
                            className={`transport-btn ${transportMode === mode.value ? 'active' : ''}`}
                            onClick={() => setTransportMode(mode.value)}
                        >
                            <span className="transport-label">{mode.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                className="submit-btn"
                disabled={!coordinates}
            >
                添加人员
            </button>
        </form>
    );
}

export default PersonForm;
