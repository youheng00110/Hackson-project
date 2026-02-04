/**
 * 主交互逻辑模块
 * 负责人员管理、API调用、结果展示等功能
 */

// 全局状态
let persons = [];
let personIdCounter = 0;
let currentPickingPersonId = null;
let currentResults = null;
let activeResultIndex = -1;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化地图
    if (!mapHandler.init('map')) {
        alert('地图初始化失败，请刷新页面重试');
        return;
    }

    // 默认添加2个人员
    addPerson();
    addPerson();
});

/**
 * 添加人员
 */
function addPerson() {
    if (persons.length >= 10) {
        alert('最多支持10个人');
        return;
    }

    personIdCounter++;
    const personId = personIdCounter;
    
    persons.push({
        id: personId,
        name: '',
        lat: null,
        lng: null,
        address: '',
        travel_mode: 'driving',
        departure_time: ''
    });

    // 创建人员卡片
    const template = document.getElementById('person-card-template');
    const card = template.content.cloneNode(true);
    const cardDiv = card.querySelector('.person-card');
    
    cardDiv.dataset.personId = personId;
    cardDiv.querySelector('.person-number').textContent = `人员 ${persons.length}`;
    cardDiv.querySelector('.person-name').value = `用户${persons.length}`;
    
    // 初始化省份城市选择
    const provinceSelect = cardDiv.querySelector('.province-select');
    const citySelect = cardDiv.querySelector('.city-select');
    const autoLocationText = cardDiv.querySelector('.auto-location-text');
    const autoLatInput = cardDiv.querySelector('.location-auto-mode .person-lat');
    const autoLngInput = cardDiv.querySelector('.location-auto-mode .person-lng');
    const manualInput = cardDiv.querySelector('.location-manual-mode .person-address');
    const manualLatInput = cardDiv.querySelector('.location-manual-mode .person-lat');
    const manualLngInput = cardDiv.querySelector('.location-manual-mode .person-lng');
    const suggestionsDropdown = cardDiv.querySelector('.suggestions-dropdown');
    
    // 添加省份选项
    const provinces = [
        {code: '', name: '选择省份'},
        {code: '110000', name: '北京市'},
        {code: '120000', name: '天津市'},
        {code: '130000', name: '河北省'},
        {code: '140000', name: '山西省'},
        {code: '150000', name: '内蒙古自治区'},
        {code: '210000', name: '辽宁省'},
        {code: '220000', name: '吉林省'},
        {code: '230000', name: '黑龙江省'},
        {code: '310000', name: '上海市'},
        {code: '320000', name: '江苏省'},
        {code: '330000', name: '浙江省'},
        {code: '340000', name: '安徽省'},
        {code: '350000', name: '福建省'},
        {code: '360000', name: '江西省'},
        {code: '370000', name: '山东省'},
        {code: '410000', name: '河南省'},
        {code: '420000', name: '湖北省'},
        {code: '430000', name: '湖南省'},
        {code: '440000', name: '广东省'},
        {code: '450000', name: '广西壮族自治区'},
        {code: '460000', name: '海南省'},
        {code: '500000', name: '重庆市'},
        {code: '510000', name: '四川省'},
        {code: '520000', name: '贵州省'},
        {code: '530000', name: '云南省'},
        {code: '540000', name: '西藏自治区'},
        {code: '610000', name: '陕西省'},
        {code: '620000', name: '甘肃省'},
        {code: '630000', name: '青海省'},
        {code: '640000', name: '宁夏回族自治区'},
        {code: '650000', name: '新疆维吾尔自治区'},
        {code: '710000', name: '台湾省'},
        {code: '810000', name: '香港特别行政区'},
        {code: '820000', name: '澳门特别行政区'}
    ];
    
    provinces.forEach(prov => {
        const option = document.createElement('option');
        option.value = prov.code;
        option.textContent = prov.name;
        provinceSelect.appendChild(option);
    });
    
    // 绑定事件
    const nameInput = cardDiv.querySelector('.person-name');
    const travelModeSelect = cardDiv.querySelector('.person-travel-mode');
    const departureTimeInput = cardDiv.querySelector('.person-departure-time');

    nameInput.addEventListener('change', function() {
        updatePersonData(personId, 'name', this.value);
    });

    // 手动输入地址事件
    manualInput.addEventListener('input', function() {
        showAddressSuggestions(personId, this.value);
    });

    manualInput.addEventListener('change', function() {
        geocodeAddress(personId, this.value);
    });

    manualInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            geocodeAddress(personId, this.value);
        }
    });

    travelModeSelect.addEventListener('change', function() {
        updatePersonData(personId, 'travel_mode', this.value);
    });

    departureTimeInput.addEventListener('change', function() {
        updatePersonData(personId, 'departure_time', this.value);
    });
    
    // 搜索建议点击事件
    suggestionsDropdown.addEventListener('click', function(e) {
        if (e.target.classList.contains('suggestion-item')) {
            const address = e.target.getAttribute('data-address');
            manualInput.value = address;
            geocodeAddress(personId, address);
            suggestionsDropdown.style.display = 'none';
        }
    });

    // 初始化名称
    updatePersonData(personId, 'name', `用户${persons.length}`);

    document.getElementById('persons-list').appendChild(card);
}

/**
 * 切换位置选择模式
 */
function switchLocationMode(btn, mode) {
    const card = btn.closest('.person-card');
    const autoMode = card.querySelector('.location-auto-mode');
    const manualMode = card.querySelector('.location-manual-mode');
    const modeBtns = card.querySelectorAll('.location-mode-btn');
    
    // 更新按钮状态
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // 显示相应模式的界面
    if (mode === 'auto') {
        autoMode.style.display = 'block';
        manualMode.style.display = 'none';
    } else if (mode === 'manual') {
        autoMode.style.display = 'none';
        manualMode.style.display = 'block';
    }
}

/**
 * 更新城市选择下拉框
 */
function updateCitySelect(provinceSelect) {
    const card = provinceSelect.closest('.person-card');
    const citySelect = card.querySelector('.city-select');
    const autoLocationText = card.querySelector('.auto-location-text');
    
    // 清空城市选择
    citySelect.innerHTML = '<option value="">选择城市</option>';
    autoLocationText.textContent = '请选择城市';
    
    const provinceCode = provinceSelect.value;
    if (!provinceCode) return;
    
    // 根据省份获取城市列表
    const cities = getCitiesByProvince(provinceCode);
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.code;
        option.textContent = city.name;
        citySelect.appendChild(option);
    });
}

/**
 * 根据省份代码获取城市列表
 */
function getCitiesByProvince(provinceCode) {
    // 这里可以根据需要扩展更多城市数据
    const cityMap = {
        '110000': [  // 北京
            {code: '110100', name: '北京市'}
        ],
        '120000': [  // 天津
            {code: '120100', name: '天津市'}
        ],
        '310000': [  // 上海
            {code: '310100', name: '上海市'}
        ],
        '500000': [  // 重庆
            {code: '500100', name: '重庆市'}
        ],
        '130000': [  // 河北
            {code: '130100', name: '石家庄市'},
            {code: '130200', name: '唐山市'},
            {code: '130300', name: '秦皇岛市'},
            {code: '130400', name: '邯郸市'},
            {code: '130500', name: '邢台市'},
            {code: '130600', name: '保定市'},
            {code: '130700', name: '张家口市'},
            {code: '130800', name: '承德市'},
            {code: '130900', name: '沧州市'},
            {code: '131000', name: '廊坊市'},
            {code: '131100', name: '衡水市'}
        ],
        '140000': [  // 山西
            {code: '140100', name: '太原市'},
            {code: '140200', name: '大同市'},
            {code: '140300', name: '阳泉市'},
            {code: '140400', name: '长治市'},
            {code: '140500', name: '晋城市'},
            {code: '140600', name: '朔州市'},
            {code: '140700', name: '晋中市'},
            {code: '140800', name: '运城市'},
            {code: '140900', name: '忻州市'},
            {code: '141000', name: '临汾市'},
            {code: '141100', name: '吕梁市'}
        ],
        '210000': [  // 辽宁
            {code: '210100', name: '沈阳市'},
            {code: '210200', name: '大连市'},
            {code: '210300', name: '鞍山市'},
            {code: '210400', name: '抚顺市'},
            {code: '210500', name: '本溪市'},
            {code: '210600', name: '丹东市'},
            {code: '210700', name: '锦州市'},
            {code: '210800', name: '营口市'},
            {code: '210900', name: '阜新市'},
            {code: '211000', name: '辽阳市'},
            {code: '211100', name: '盘锦市'},
            {code: '211200', name: '铁岭市'},
            {code: '211300', name: '朝阳市'},
            {code: '211400', name: '葫芦岛市'}
        ],
        '320000': [  // 江苏
            {code: '320100', name: '南京市'},
            {code: '320200', name: '无锡市'},
            {code: '320300', name: '徐州市'},
            {code: '320400', name: '常州市'},
            {code: '320500', name: '苏州市'},
            {code: '320600', name: '南通市'},
            {code: '320700', name: '连云港市'},
            {code: '320800', name: '淮安市'},
            {code: '320900', name: '盐城市'},
            {code: '321000', name: '扬州市'},
            {code: '321100', name: '镇江市'},
            {code: '321200', name: '泰州市'},
            {code: '321300', name: '宿迁市'}
        ],
        '330000': [  // 浙江
            {code: '330100', name: '杭州市'},
            {code: '330200', name: '宁波市'},
            {code: '330300', name: '温州市'},
            {code: '330400', name: '嘉兴市'},
            {code: '330500', name: '湖州市'},
            {code: '330600', name: '绍兴市'},
            {code: '330700', name: '金华市'},
            {code: '330800', name: '衢州市'},
            {code: '330900', name: '舟山市'},
            {code: '331000', name: '台州市'},
            {code: '331100', name: '丽水市'}
        ],
        '370000': [  // 山东
            {code: '370100', name: '济南市'},
            {code: '370200', name: '青岛市'},
            {code: '370300', name: '淄博市'},
            {code: '370400', name: '枣庄市'},
            {code: '370500', name: '东营市'},
            {code: '370600', name: '烟台市'},
            {code: '370700', name: '潍坊市'},
            {code: '370800', name: '济宁市'},
            {code: '370900', name: '泰安市'},
            {code: '371000', name: '威海市'},
            {code: '371100', name: '日照市'},
            {code: '371300', name: '临沂市'},
            {code: '371400', name: '德州市'},
            {code: '371500', name: '聊城市'},
            {code: '371600', name: '滨州市'},
            {code: '371700', name: '菏泽市'}
        ],
        '440000': [  // 广东
            {code: '440100', name: '广州市'},
            {code: '440200', name: '韶关市'},
            {code: '440300', name: '深圳市'},
            {code: '440400', name: '珠海市'},
            {code: '440500', name: '汕头市'},
            {code: '440600', name: '佛山市'},
            {code: '440700', name: '江门市'},
            {code: '440800', name: '湛江市'},
            {code: '440900', name: '茂名市'},
            {code: '441200', name: '肇庆市'},
            {code: '441300', name: '惠州市'},
            {code: '441400', name: '梅州市'},
            {code: '441500', name: '汕尾市'},
            {code: '441600', name: '河源市'},
            {code: '441700', name: '阳江市'},
            {code: '441800', name: '清远市'},
            {code: '441900', name: '东莞市'},
            {code: '442000', name: '中山市'},
            {code: '445100', name: '潮州市'},
            {code: '445200', name: '揭阳市'},
            {code: '445300', name: '云浮市'}
        ]
    };
    
    return cityMap[provinceCode] || [];
}

/**
 * 根据选择的城市更新位置（现在用于手动输入模式）
 */
function updateLocationFromCity(citySelect) {
    const card = citySelect.closest('.person-card');
    const autoLocationText = card.querySelector('.location-manual-mode .auto-location-text');
    const autoLatInput = card.querySelector('.location-manual-mode .person-lat');
    const autoLngInput = card.querySelector('.location-manual-mode .person-lng');
    
    const cityCode = citySelect.value;
    const cityName = citySelect.options[citySelect.selectedIndex].text;
    
    if (!cityCode) {
        // 不设置任何内容，让用户输入详细地址
        return;
    }
    
    // 将城市名填入地址输入框
    const addressInput = card.querySelector('.location-manual-mode .person-address');
    addressInput.value = cityName;
    
    // 触发地址解析
    geocodeAddress(parseInt(card.dataset.personId), cityName);
}

/**
 * 获取当前位置（用于自动定位模式）- 使用IP定位
 */
async function getCurrentLocation(btn) {
    const card = btn.closest('.person-card');
    const autoLocationText = card.querySelector('.auto-location-text');
    const autoLatInput = card.querySelector('.location-auto-mode .person-lat');
    const autoLngInput = card.querySelector('.location-auto-mode .person-lng');
    
    autoLocationText.textContent = '正在获取位置...';
    
    try {
        // 使用免费的IP定位服务获取大致位置
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
            const lat = data.latitude;
            const lng = data.longitude;
            
            // 更新数据
            const personId = parseInt(card.dataset.personId);
            updatePersonData(personId, 'lat', lat);
            updatePersonData(personId, 'lng', lng);
            
            // 更新隐藏字段
            autoLatInput.value = lat;
            autoLngInput.value = lng;
            
            // 逆地理编码获取地址
            try {
                const addrResponse = await fetch('/api/reverse_geocode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat, lng })
                });

                const result = await addrResponse.json();
                
                if (result.status === 'success') {
                    updatePersonData(personId, 'address', result.address);
                    autoLocationText.textContent = result.address;
                } else {
                    updatePersonData(personId, 'address', `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`);
                    autoLocationText.textContent = `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`;
                }
            } catch (addrError) {
                console.error('逆地理编码错误:', addrError);
                updatePersonData(personId, 'address', `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`);
                autoLocationText.textContent = `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`;
            }
            
            // 更新地图标记
            const person = persons.find(p => p.id === personId);
            const personIndex = persons.indexOf(person);
            mapHandler.addPersonMarker(personId, lat, lng, person.name, mapHandler.getColor(personIndex));
            mapHandler.fitViewToAllMarkers();
        } else {
            throw new Error('无法获取位置信息');
        }
    } catch (error) {
        console.error('IP定位失败:', error);
        autoLocationText.textContent = 'IP定位失败，请手动输入位置或尝试其他方式';
    }
}

/**
 * 显示地址搜索建议
 */
async function showAddressSuggestions(personId, query) {
    if (!query || query.length < 2) {
        hideSuggestions(personId);
        return;
    }
    
    const card = document.querySelector(`.person-card[data-person-id="${personId}"]`);
    const input = card.querySelector('.location-manual-mode .person-address');
    const suggestionsDropdown = card.querySelector('.suggestions-dropdown');
    
    try {
        // 获取地址搜索建议
        const suggestions = await getSuggestions(query);
        
        if (suggestions.length > 0) {
            suggestionsDropdown.innerHTML = '';
            suggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                
                let displayText, dataValue;
                if (typeof suggestion === 'object') {
                    // 如果是对象，组合显示名称和地址
                    displayText = suggestion.name || suggestion.address || `${suggestion.city || ''}${suggestion.district || ''}`;
                    dataValue = suggestion.name || suggestion.address || displayText;
                    // 存储完整对象信息到data属性
                    item.setAttribute('data-suggestion-full', JSON.stringify(suggestion));
                } else {
                    // 如果是字符串，直接使用
                    displayText = dataValue = suggestion;
                }
                
                item.setAttribute('data-address', dataValue);
                item.textContent = displayText;
                suggestionsDropdown.appendChild(item);
            });
            
            // 保存suggestions到card元素，以便在点击事件中使用
            card.setAttribute('data-current-suggestions', JSON.stringify(suggestions));
            suggestionsDropdown.style.display = 'block';
        } else {
            hideSuggestions(personId);
        }
    } catch (error) {
        console.error('获取搜索建议失败:', error);
    }
}

/**
 * 获取地址搜索建议（调用后端API）
 */
async function getSuggestions(query) {
    try {
        const response = await fetch('/api/suggest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            return result.suggestions.slice(0, 3); // 返回前3个建议
        } else {
            console.error('获取地址建议失败:', result.message);
            return [];
        }
    } catch (error) {
        console.error('获取地址建议请求失败:', error);
        return [];
    }
}

/**
 * 隐藏搜索建议
 */
function hideSuggestions(personId) {
    const card = document.querySelector(`.person-card[data-person-id="${personId}"]`);
    const suggestionsDropdown = card.querySelector('.suggestions-dropdown');
    suggestionsDropdown.style.display = 'none';
}

/**
 * 更新半径滑块
 */
function updateRadiusSlider(value) {
    const slider = document.getElementById('search-radius-slider');
    const input = document.getElementById('search-radius-input');
    const valueDisplay = document.getElementById('radius-value');
    
    // 限制值在合理范围内
    value = Math.min(Math.max(value, 1000), 20000);
    
    // 更新滑块、输入框和显示值
    slider.value = value;
    input.value = value;
    valueDisplay.textContent = `${value} 米`;
}

/**
 * 移除人员
 */
function removePerson(btn) {
    if (persons.length <= 2) {
        alert('至少需要2个人');
        return;
    }

    const card = btn.closest('.person-card');
    const personId = parseInt(card.dataset.personId);

    // 从数组中移除
    persons = persons.filter(p => p.id !== personId);

    // 移除地图标记
    mapHandler.removePersonMarker(personId);

    // 移除DOM元素
    card.remove();

    // 更新编号
    updatePersonNumbers();
}

/**
 * 更新人员编号显示
 */
function updatePersonNumbers() {
    const cards = document.querySelectorAll('.person-card');
    cards.forEach((card, index) => {
        card.querySelector('.person-number').textContent = `人员 ${index + 1}`;
    });
}

/**
 * 更新人员数据
 */
function updatePersonData(personId, field, value) {
    const person = persons.find(p => p.id === personId);
    if (person) {
        person[field] = value;
    }
}

/**
 * 地理编码（地址转坐标）
 */
async function geocodeAddress(personId, address) {
    if (!address.trim()) return;

    const card = document.querySelector(`.person-card[data-person-id="${personId}"]`);
    const statusDiv = card.querySelector('.location-status');
    
    statusDiv.textContent = '正在解析地址...';
    statusDiv.className = 'location-status';

    try {
        const response = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: address })
        });

        const result = await response.json();

        if (result.status === 'success') {
            const { lat, lng } = result.location;
            
            // 更新数据
            updatePersonData(personId, 'lat', lat);
            updatePersonData(personId, 'lng', lng);
            updatePersonData(personId, 'address', address);

            // 更新隐藏字段
            card.querySelector('.person-lat').value = lat;
            card.querySelector('.person-lng').value = lng;

            // 更新状态显示
            statusDiv.textContent = `已定位: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            statusDiv.className = 'location-status success';

            // 更新地图标记
            const person = persons.find(p => p.id === personId);
            const personIndex = persons.indexOf(person);
            mapHandler.addPersonMarker(personId, lat, lng, person.name, mapHandler.getColor(personIndex));
            mapHandler.fitViewToAllMarkers();
        } else {
            statusDiv.textContent = result.message || '地址解析失败';
            statusDiv.className = 'location-status error';
        }
    } catch (error) {
        statusDiv.textContent = '网络错误，请重试';
        statusDiv.className = 'location-status error';
        console.error('地理编码错误:', error);
    }
}

/**
 * 从地图选点
 */
function pickLocationFromMap(btn) {
    const card = btn.closest('.person-card');
    const personId = parseInt(card.dataset.personId);

    // 标记当前选点的人员
    document.querySelectorAll('.person-card').forEach(c => c.classList.remove('picking'));
    card.classList.add('picking');
    currentPickingPersonId = personId;

    const statusDiv = card.querySelector('.location-status');
    statusDiv.textContent = '请在地图上点击选择位置...';
    statusDiv.className = 'location-status';

    // 启用地图选点模式
    mapHandler.enableLocationPicker(async (lat, lng) => {
        card.classList.remove('picking');
        currentPickingPersonId = null;

        // 更新数据
        updatePersonData(personId, 'lat', lat);
        updatePersonData(personId, 'lng', lng);

        // 更新隐藏字段
        card.querySelector('.person-lat').value = lat;
        card.querySelector('.person-lng').value = lng;

        // 逆地理编码获取地址
        try {
            const response = await fetch('/api/reverse_geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lng })
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                card.querySelector('.person-address').value = result.address;
                updatePersonData(personId, 'address', result.address);
            }
        } catch (error) {
            console.error('逆地理编码错误:', error);
        }

        // 更新状态显示
        statusDiv.textContent = `已定位: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        statusDiv.className = 'location-status success';

        // 更新地图标记
        const person = persons.find(p => p.id === personId);
        const personIndex = persons.indexOf(person);
        mapHandler.addPersonMarker(personId, lat, lng, person.name, mapHandler.getColor(personIndex));
    });
}

/**
 * 计算会面点
 */
async function calculateMeetingPoints() {
    // 验证数据
    const validPersons = persons.filter(p => p.lat !== null && p.lng !== null);
    
    if (validPersons.length < 2) {
        alert('请至少为2个人设置位置');
        return;
    }

    // 获取POI类型（支持多选）
    const selectedPoiTypes = Array.from(document.querySelectorAll('input[name="poi_type"]:checked')).map(cb => cb.value);
    const poiType = selectedPoiTypes.join(',');

    // 获取选定的城市
    const meetingCity = document.getElementById('meeting-city-select').value;
    
    // 获取搜索半径
    const searchRadius = parseInt(document.getElementById('search-radius-input').value);

    // 显示加载状态
    showLoading('正在搜索候选会面点...');

    try {
        const requestData = {
            persons: validPersons.map(p => ({
                id: p.id,
                name: p.name || `用户${p.id}`,
                lat: p.lat,
                lng: p.lng,
                travel_mode: p.travel_mode,
                departure_time: p.departure_time || null
            })),
            poi_type: poiType,
            meeting_city: meetingCity,  // 添加选定城市信息
            search_radius: searchRadius  // 添加搜索半径信息
        };

        updateLoadingText('正在计算路线...');

        console.log('发送请求数据:', requestData); // 调试信息
        
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        console.log('收到响应:', response); // 调试信息
        
        const result = await response.json();
        
        console.log('解析结果:', result); // 调试信息

        hideLoading();

        if (result.status === 'success') {
            currentResults = result;
            displayResults(result);
        } else {
            alert(result.message || '计算失败，请重试');
        }
    } catch (error) {
        hideLoading();
        alert('网络错误，请重试');
        console.error('计算错误:', error);
    }
}

/**
 * 显示结果
 */
function displayResults(result) {
    const resultsSection = document.getElementById('results-section');
    const resultsList = document.getElementById('results-list');

    // 清空旧结果
    resultsList.innerHTML = '';
    mapHandler.clearMeetingMarkers();
    mapHandler.clearRoutes();

    if (!result.meeting_points || result.meeting_points.length === 0) {
        resultsList.innerHTML = '<p style="color: #666; text-align: center;">未找到合适的会面点</p>';
        resultsSection.style.display = 'block';
        return;
    }

    // 添加中心点标记
    if (result.center) {
        mapHandler.addCenterMarker(result.center.lat, result.center.lng);
    }

    // 创建结果卡片
    const template = document.getElementById('result-card-template');
    
    result.meeting_points.forEach((point, index) => {
        const card = template.content.cloneNode(true);
        const cardDiv = card.querySelector('.result-card');
        
        cardDiv.dataset.pointIndex = index;
        cardDiv.querySelector('.result-rank').textContent = point.rank;
        cardDiv.querySelector('.result-name').textContent = point.name;
        cardDiv.querySelector('.result-address').textContent = point.address;
        cardDiv.querySelector('.max-duration').textContent = point.max_duration_text;
        cardDiv.querySelector('.avg-duration').textContent = point.avg_duration_text;

        // 添加每人路线详情
        const routesDetail = cardDiv.querySelector('.routes-detail');
        point.routes.forEach(route => {
            const routeItem = document.createElement('div');
            routeItem.className = 'route-item';
            
            if (route.unreachable) {
                routeItem.innerHTML = `
                    <span class="route-person">${route.person_name}</span>
                    <span class="route-info route-unreachable">不可达</span>
                `;
            } else {
                const modeText = {
                    'driving': '驾车',
                    'transit': '公交',
                    'walking': '步行',
                    'riding': '骑行'
                }[route.travel_mode] || route.travel_mode;
                
                routeItem.innerHTML = `
                    <span class="route-person">${route.person_name} (${modeText})</span>
                    <span class="route-info">${route.distance_text} / ${route.duration_text}</span>
                `;
            }
            routesDetail.appendChild(routeItem);
        });

        // 绑定点击事件
        cardDiv.addEventListener('click', function(e) {
            if (!e.target.classList.contains('view-routes-btn')) {
                selectResult(index);
            }
        });

        // 查看路线按钮
        cardDiv.querySelector('.view-routes-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            toggleRoutesDetail(cardDiv);
        });

        resultsList.appendChild(card);

        // 添加会面点标记
        mapHandler.addMeetingMarker(
            point.location.lat, 
            point.location.lng, 
            point.rank, 
            point.name, 
            point.address
        );
    });

    resultsSection.style.display = 'block';

    // 默认选中第一个结果
    selectResult(0);

    // 调整地图视野
    mapHandler.fitViewToAllMarkers();
}

/**
 * 选中结果
 */
function selectResult(index) {
    if (!currentResults || !currentResults.meeting_points[index]) return;

    activeResultIndex = index;
    const point = currentResults.meeting_points[index];

    // 更新卡片样式
    document.querySelectorAll('.result-card').forEach((card, i) => {
        card.classList.toggle('active', i === index);
    });

    // 清除旧路线，绘制新路线
    mapHandler.clearRoutes();
    
    point.routes.forEach((route, routeIndex) => {
        if (!route.unreachable && route.path && route.path.length > 0) {
            const color = mapHandler.getColor(routeIndex);
            mapHandler.drawRoute(route.path, color, route.person_name);
        }
    });
}

/**
 * 切换路线详情显示
 */
function toggleRoutesDetail(cardDiv) {
    const detail = cardDiv.querySelector('.routes-detail');
    const btn = cardDiv.querySelector('.view-routes-btn');
    
    if (detail.style.display === 'none') {
        detail.style.display = 'block';
        btn.textContent = '隐藏路线';
    } else {
        detail.style.display = 'none';
        btn.textContent = '查看路线';
    }
}

/**
 * 显示加载状态
 */
function showLoading(text) {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').style.display = 'flex';
}

/**
 * 更新加载文本
 */
function updateLoadingText(text) {
    document.getElementById('loading-text').textContent = text;
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

/**
 * 一键清空所有数据
 */
function clearAllData() {
    if (!confirm('确定要清空所有输入的数据吗？此操作不可撤销。')) {
        return;
    }
    
    // 清空人员列表
    persons = [];
    personIdCounter = 0;
    currentPickingPersonId = null;
    currentResults = null;
    activeResultIndex = -1;
    
    // 清空人员列表容器
    const personsList = document.getElementById('persons-list');
    personsList.innerHTML = '';
    
    // 清空POI类型选择
    const poiTypeCheckboxes = document.querySelectorAll('input[name="poi_type"]');
    poiTypeCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
        // 默认勾选第一个
        if (checkbox === poiTypeCheckboxes[0]) {
            checkbox.checked = true;
        }
    });
    
    // 清空结果区域
    const resultsSection = document.getElementById('results-section');
    resultsSection.style.display = 'none';
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '';
    
    // 清空地图
    if (window.mapHandler) {
        mapHandler.clearAll(); // 使用地图处理器的clearAll方法
    }
    
    // 重新添加两个默认人员
    addPerson();
    addPerson();
    
    alert('所有数据已清空！');
}
