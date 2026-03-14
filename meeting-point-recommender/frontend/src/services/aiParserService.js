/**
 * AI 自然语言解析服务
 * 功能：将用户的自然语言需求解析为结构化参数
 * 包括：会面点类型、搜索半径、计算策略等
 */

// 会面点类型关键词映射
const TYPE_KEYWORDS = {
  // 餐饮类
  'cafe': ['咖啡', '咖啡馆', '咖啡厅', 'cafe', '拿铁', '美式'],
  'restaurant': ['餐厅', '餐馆', '饭店', '美食', '吃饭', '聚餐', '用餐'],
  'tea': ['茶', '茶馆', '奶茶', '饮品'],
  
  // 娱乐休闲类
  'park': ['公园', '绿地', '广场', '户外', '散步'],
  'cinema': ['电影院', '影城', '电影', '观影'],
  'ktv': ['KTV', '唱歌', '卡拉OK'],
  'mall': ['购物中心', '商场', '百货', '购物', '逛街'],
  
  // 商务办公类
  'library': ['图书馆', '自习室', '学习', '看书'],
  'office': ['写字楼', '办公室', '商务', '会议']
};

// 计算策略关键词映射
const STRATEGY_KEYWORDS = {
  'balanced': ['综合', '平衡', '推荐', '智能', '默认'],
  'time_gap': ['时间', '快', '迅速', '尽快', '时效'],
  'distance_gap': ['距离', '近', '步行', '走路', '靠近']
};

// 距离关键词映射（米）
const DISTANCE_KEYWORDS = {
  1000: ['1公里', '1千米', '附近', '旁边', '近距离'],
  2000: ['2公里', '2千米', '不远', '较近'],
  3000: ['3公里', '3千米', '适中', '中等距离'],
  5000: ['5公里', '5千米', '稍远', '远一点']
};

/**
 * AI 自然语言解析服务类
 */
class AiParserService {
  /**
   * 解析用户输入的自然语言需求
   * @param {string} userInput - 用户输入的自然语言
   * @returns {Object} 解析结果 { types, radius, strategy, summary }
   */
  static parseUserInput(userInput) {
    // 转换为小写便于匹配
    const input = userInput.toLowerCase();
    
    // 提取会面点类型
    const types = this.extractTypes(input);
    
    // 提取搜索半径
    const radius = this.extractRadius(input);
    
    // 提取计算策略
    const strategy = this.extractStrategy(input);
    
    // 生成摘要
    const summary = this.generateSummary(types, radius, strategy);
    
    return {
      types,
      radius,
      strategy,
      summary,
      originalInput: userInput
    };
  }

  /**
   * 提取会面点类型
   * @param {string} input - 用户输入
   * @returns {Array} 类型数组
   */
  static extractTypes(input) {
    const foundTypes = [];
    
    // 遍历类型关键词映射
    for (const [typeId, keywords] of Object.entries(TYPE_KEYWORDS)) {
      // 检查是否包含任一关键词
      if (keywords.some(keyword => input.includes(keyword))) {
        foundTypes.push(typeId);
      }
    }
    
    // 如果没识别到具体类型，默认推荐常用类型
    if (foundTypes.length === 0) {
      return ['cafe', 'restaurant', 'mall']; // 默认推荐咖啡、餐厅、商场
    }
    
    return foundTypes;
  }

  /**
   * 提取搜索半径
   * @param {string} input - 用户输入
   * @returns {number} 半径（米）
   */
  static extractRadius(input) {
    // 检查具体数值（如"1000米"、"1公里"）
    const numberMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:米|m|公里|km|千米)/i);
    if (numberMatch) {
      const value = parseFloat(numberMatch[1]);
      // 如果是公里单位，转换为米
      if (/公里|km|千米/i.test(numberMatch[0])) {
        return Math.min(Math.max(value * 1000, 1000), 10000);
      }
      return Math.min(Math.max(value, 1000), 10000);
    }
    
    // 检查关键词匹配
    for (const [radius, keywords] of Object.entries(DISTANCE_KEYWORDS)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return parseInt(radius);
      }
    }
    
    // 检查步行时间（如"步行10分钟"）
    const walkTimeMatch = input.match(/步行\s*(\d+)\s*分钟/i);
    if (walkTimeMatch) {
      const minutes = parseInt(walkTimeMatch[1]);
      // 假设步行速度 80米/分钟
      return Math.min(Math.max(minutes * 80, 1000), 5000);
    }
    
    // 默认半径 3000 米
    return 3000;
  }

  /**
   * 提取计算策略
   * @param {string} input - 用户输入
   * @returns {string} 策略类型
   */
  static extractStrategy(input) {
    // 遍历策略关键词映射
    for (const [strategy, keywords] of Object.entries(STRATEGY_KEYWORDS)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return strategy;
      }
    }
    
    // 默认使用平衡策略
    return 'balanced';
  }

  /**
   * 生成解析摘要
   * @param {Array} types - 会面点类型
   * @param {number} radius - 搜索半径
   * @param {string} strategy - 计算策略
   * @returns {string} 摘要文本
   */
  static generateSummary(types, radius, strategy) {
    // 类型描述映射
    const typeLabels = {
      'cafe': '咖啡馆',
      'restaurant': '餐厅',
      'tea': '茶馆',
      'park': '公园',
      'cinema': '电影院',
      'ktv': 'KTV',
      'mall': '购物中心',
      'library': '图书馆',
      'office': '商务场所'
    };
    
    // 策略描述映射
    const strategyLabels = {
      'balanced': '综合推荐',
      'time_gap': '时间优先',
      'distance_gap': '距离优先'
    };
    
    // 构建摘要
    const typeText = types.map(t => typeLabels[t] || t).join('、') || '多种类型';
    const radiusText = `${radius}米`;
    const strategyText = strategyLabels[strategy] || '智能推荐';
    
    return `为您推荐${typeText}类型的会面点，搜索范围${radiusText}，采用${strategyText}策略。`;
  }

  /**
   * 将解析结果转换为 API 参数格式
   * @param {Object} parsedResult - 解析结果
   * @returns {Object} API 参数对象
   */
  static convertToApiParams(parsedResult) {
    // 类型关键词映射到 POI 搜索关键词
    const typeKeywords = {
      'cafe': ['咖啡', '咖啡厅', '咖啡馆'],
      'restaurant': ['美食', '餐厅', '餐馆'],
      'tea': ['茶馆', '奶茶', '饮品店'],
      'park': ['公园', '绿地', '广场'],
      'cinema': ['电影院', '影城'],
      'ktv': ['KTV', '卡拉OK'],
      'mall': ['购物中心', '商场', '百货'],
      'library': ['图书馆', '自习室'],
      'office': ['写字楼', '商务中心']
    };
    
    // 生成 POI 搜索关键词
    const poiTypes = parsedResult.types.flatMap(typeId => 
      typeKeywords[typeId] || []
    );
    
    return {
      poiTypes: poiTypes.length > 0 ? poiTypes : ['美食', '咖啡', '商场'], // 默认关键词
      searchRadius: parsedResult.radius,
      objective: parsedResult.strategy
    };
  }

  /**
   * 生成 AI 回复消息
   * @param {Object} parsedResult - 解析结果
   * @returns {string} AI 回复内容
   */
  static generateAiResponse(parsedResult) {
    const { types, radius, strategy, summary } = parsedResult;
    
    // 根据解析结果生成个性化的回复
    let response = `好的，我已经理解您的需求：\n\n`;
    response += `📌 ${summary}\n\n`;
    response += `接下来我将为您搜索符合条件的会面点...`;
    
    return response;
  }

  /**
   * 验证解析结果的有效性
   * @param {Object} parsedResult - 解析结果
   * @returns {Object} 验证结果 { isValid, errors }
   */
  static validateResult(parsedResult) {
    const errors = [];
    
    // 验证类型
    if (!Array.isArray(parsedResult.types) || parsedResult.types.length === 0) {
      errors.push('未识别出会面点类型');
    }
    
    // 验证半径
    if (typeof parsedResult.radius !== 'number' || 
        parsedResult.radius < 1000 || 
        parsedResult.radius > 10000) {
      errors.push('搜索半径应在1000-10000米范围内');
    }
    
    // 验证策略
    const validStrategies = ['balanced', 'time_gap', 'distance_gap'];
    if (!validStrategies.includes(parsedResult.strategy)) {
      errors.push('计算策略无效');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default AiParserService;
