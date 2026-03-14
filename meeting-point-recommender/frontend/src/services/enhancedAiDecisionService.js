/**
 * 增强版 AI 决策服务
 * 功能：结合路况、天气、口碑、停车等因素提供智能推荐说明
 * 特点：贴近日常沟通的语言风格，帮助用户快速定案
 */

class EnhancedAiDecisionService {
  /**
   * 生成智能推荐说明
   * @param {Array} candidates - 候选点数组
   * @param {Array} persons - 参与人员数组
   * @param {Object} weatherInfo - 天气信息
   * @returns {Object} { rankedCandidates: 按 AI 评分排序的数组，originalCandidates: 原始顺序数组 }
   */
  static generateEnhancedRecommendations(candidates, persons, weatherInfo = null) {
    // 模拟天气数据（实际应从 API 获取）
    const mockWeather = weatherInfo || {
      condition: '晴天',
      temperature: 22,
      windSpeed: 3,
      isRainy: false
    };

    // 为每个候选点计算评分和推荐说明
    const enhanced = candidates.map(candidate => {
      // 计算各项评分因子
      const trafficScore = this.calculateTrafficScore(candidate, persons);
      const weatherScore = this.calculateWeatherScore(candidate, mockWeather);
      const facilityScore = this.calculateFacilityScore(candidate);
      const reputationScore = this.calculateReputationScore(candidate);
      const parkingScore = this.calculateParkingScore(candidate);

      // 计算综合得分
      const totalScore = this.calculateTotalScore(trafficScore, weatherScore, facilityScore, reputationScore, parkingScore);

      // 生成综合推荐说明
      const recommendation = this.generateRecommendationText(
        candidate,
        trafficScore,
        weatherScore,
        facilityScore,
        reputationScore,
        parkingScore,
        mockWeather
      );

      return {
        ...candidate,
        enhancedScores: {
          traffic: trafficScore,
          weather: weatherScore,
          facilities: facilityScore,
          reputation: reputationScore,
          parking: parkingScore,
          total: totalScore
        },
        recommendation,
        aiRanking: totalScore // 用于排序的 AI 评分
      };
    });

    // 生成 AI 推荐排序（按综合评分降序）
    const rankedCandidates = [...enhanced].sort((a, b) => b.aiRanking - a.aiRanking);

    // 为排名添加序号
    rankedCandidates.forEach((candidate, index) => {
      candidate.aiRank = index + 1;
    });

    // 原始顺序保持不变
    const originalCandidates = enhanced;

    return {
      rankedCandidates,  // AI 推荐排序（用于聊天框输出）
      originalCandidates // 原始顺序（用于右侧面板显示）
    };
  }

  /**
   * 计算综合得分
   */
  static calculateTotalScore(trafficScore, weatherScore, facilityScore, reputationScore, parkingScore) {
    const weights = {
      traffic: 0.25,
      weather: 0.2,
      facilities: 0.2,
      reputation: 0.15,
      parking: 0.2
    };

    return (
      trafficScore * weights.traffic +
      weatherScore * weights.weather +
      facilityScore * weights.facilities +
      reputationScore * weights.reputation +
      parkingScore * weights.parking
    );
  }

  /**
   * 计算交通便利性评分
   * @param {Object} candidate - 候选点
   * @param {Array} persons - 参与人员
   * @returns {number} 评分 (0-100)
   */
  static calculateTrafficScore(candidate, persons) {
    // 模拟交通评分逻辑
    const baseScore = 80;
    const timeVariation = Math.random() * 20 - 10; // -10 到 +10 的随机波动
    
    // 根据候选点类型调整评分
    let typeBonus = 0;
    if (candidate.type?.includes('地铁')) {
      typeBonus = 15;
    } else if (candidate.type?.includes('商圈')) {
      typeBonus = 10;
    } else if (candidate.type?.includes('咖啡')) {
      typeBonus = 5;
    }

    return Math.max(0, Math.min(100, baseScore + timeVariation + typeBonus));
  }

  /**
   * 计算天气适配性评分
   * @param {Object} candidate - 候选点
   * @param {Object} weather - 天气信息
   * @returns {number} 评分 (0-100)
   */
  static calculateWeatherScore(candidate, weather) {
    let score = 85; // 基础评分

    // 雨天惩罚（室外场所）
    if (weather.isRainy) {
      if (candidate.type?.includes('公园') || candidate.type?.includes('广场')) {
        score -= 30;
      } else if (candidate.type?.includes('餐厅') || candidate.type?.includes('咖啡')) {
        // 室内场所有加分
        score += 10;
      }
    }

    // 高温/低温调整
    if (weather.temperature > 30 || weather.temperature < 5) {
      if (candidate.type?.includes('室内')) {
        score += 15;
      } else if (candidate.type?.includes('户外')) {
        score -= 20;
      }
    }

    // 大风天气调整
    if (weather.windSpeed > 7) {
      if (candidate.type?.includes('露天')) {
        score -= 25;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算设施便利性评分
   * @param {Object} candidate - 候选点
   * @returns {number} 评分 (0-100)
   */
  static calculateFacilityScore(candidate) {
    let score = 70;

    // 地铁便利性
    if (candidate.nearbyMetro) {
      score += 20;
    }

    // 商圈配套
    if (candidate.type?.includes('商圈') || candidate.type?.includes('购物中心')) {
      score += 15;
    }

    // 餐饮丰富度
    if (candidate.foodOptions && candidate.foodOptions.length > 5) {
      score += 10;
    }

    // 休息设施
    if (candidate.hasRestArea) {
      score += 8;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算口碑评分
   * @param {Object} candidate - 候选点
   * @returns {number} 评分 (0-100)
   */
  static calculateReputationScore(candidate) {
    // 模拟口碑评分（实际应从点评等平台获取）
    const baseReputation = candidate.rating ? candidate.rating * 20 : 75;
    const reviewCountBonus = Math.min(15, (candidate.reviewCount || 0) / 10);
    
    return Math.max(0, Math.min(100, baseReputation + reviewCountBonus));
  }

  /**
   * 计算停车便利性评分
   * @param {Object} candidate - 候选点
   * @returns {number} 评分 (0-100)
   */
  static calculateParkingScore(candidate) {
    let score = 50; // 基础分提高

    // 有专门停车场（大幅增加权重）
    if (candidate.parkingSpaces > 0) {
      score += 35; // 从 25 提高到 35
      
      // 停车位充足程度（增加梯度）
      if (candidate.parkingSpaces > 100) {
        score += 15; // 非常充足
      } else if (candidate.parkingSpaces > 50) {
        score += 10; // 比较充足
      } else if (candidate.parkingSpaces > 20) {
        score += 5; // 基本够用
      }
    }

    // 附近路边停车（增加权重）
    if (candidate.streetParking) {
      score += 20; // 从 15 提高到 20
    }

    // 停车费用合理（增加梯度）
    if (candidate.parkingFee !== undefined) {
      if (candidate.parkingFee < 5) {
        score += 15; // 很便宜
      } else if (candidate.parkingFee < 10) {
        score += 10; // 比较合理
      } else if (candidate.parkingFee < 20) {
        score += 5; // 可以接受
      }
    }

    // 商圈/购物中心通常停车便利（类型加成）
    if (candidate.type?.includes('商圈') || 
        candidate.type?.includes('购物中心') || 
        candidate.type?.includes('广场')) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 生成推荐说明文本
   * @param {Object} candidate - 候选点
   * @param {number} trafficScore - 交通评分
   * @param {number} weatherScore - 天气评分
   * @param {number} facilityScore - 设施评分
   * @param {number} reputationScore - 口碑评分
   * @param {number} parkingScore - 停车评分
   * @param {Object} weather - 天气信息
   * @returns {string} 推荐说明
   */
  static generateRecommendationText(candidate, trafficScore, weatherScore, facilityScore, reputationScore, parkingScore, weather) {
    const scores = [
      { name: '交通便利', score: trafficScore, weight: 0.25 }, // 降低权重
      { name: '天气适配', score: weatherScore, weight: 0.2 },
      { name: '设施配套', score: facilityScore, weight: 0.2 },
      { name: '口碑评价', score: reputationScore, weight: 0.15 },
      { name: '停车便利', score: parkingScore, weight: 0.2 } // 提高权重到 0.2
    ];

    // 计算综合得分
    const totalScore = scores.reduce((sum, item) => sum + item.score * item.weight, 0);
    
    // 生成推荐文案
    let recommendation = `🌟 综合推荐指数：${Math.round(totalScore)}分\n\n`;

    // 根据不同类型生成个性化建议
    if (candidate.type?.includes('餐厅') || candidate.type?.includes('咖啡')) {
      recommendation += this.generateDiningRecommendation(candidate, scores, weather);
    } else if (candidate.type?.includes('商圈') || candidate.type?.includes('购物中心')) {
      recommendation += this.generateShoppingRecommendation(candidate, scores, weather);
    } else if (candidate.type?.includes('公园') || candidate.type?.includes('广场')) {
      recommendation += this.generateOutdoorRecommendation(candidate, scores, weather);
    } else {
      recommendation += this.generateGeneralRecommendation(candidate, scores, weather);
    }

    // 添加具体优势说明
    recommendation += '\n📋 具体优势：\n';
    scores.forEach(item => {
      if (item.score > 80) {
        recommendation += `✅ ${item.name}优秀 (${Math.round(item.score)}分)\n`;
      } else if (item.score > 60) {
        recommendation += `👍 ${item.name}良好 (${Math.round(item.score)}分)\n`;
      }
    });

    // 添加温馨提醒
    if (weather.isRainy && candidate.type?.includes('户外')) {
      recommendation += '\n⚠️ 温馨提醒：今天有雨，建议携带雨具';
    }

    return recommendation;
  }

  /**
   * 生成餐饮类推荐文案
   */
  static generateDiningRecommendation(candidate, scores, weather) {
    let text = `🍽️ 推荐这里聚餐！\n\n`;
    
    const parkingScore = scores.find(s => s.name === '停车便利').score;
    const trafficScore = scores.find(s => s.name === '交通便利').score;
    const reputationScore = scores.find(s => s.name === '口碑评价').score;
    
    // 根据最强优势调整表达顺序
    if (parkingScore > 80) {
      text += `这家${candidate.name}停车非常方便，`;  // 优先强调停车
    }
    
    if (reputationScore > 85) {
      text += '口碑极佳，深受顾客好评，';
    }
    
    if (trafficScore > 80) {
      text += '交通十分便利，大家过来都很方便，';
    }
    
    if (weather.isRainy) {
      text += '而且是室内场所，不用担心下雨，非常适合聚会。';
    } else {
      text += '环境舒适，是聚餐的好选择。';
    }
    
    return text;
  }

  /**
   * 生成购物类推荐文案
   */
  static generateShoppingRecommendation(candidate, scores, weather) {
    let text = `🛍️ 推荐这个商圈！\n\n`;
    
    const parkingScore = scores.find(s => s.name === '停车便利').score;
    const facilityScore = scores.find(s => s.name === '设施配套').score;
    
    if (parkingScore > 70) {
      text += '这里停车位非常充足，开车过来完全不用担心停车问题，'; // 优先强调停车
    }
    
    if (facilityScore > 80) {
      text += '商铺齐全，吃喝玩乐购一站式搞定，';
    }
    
    text += '非常适合大家会面，既能逛街又能聊天，环境舒适又方便。';
    
    return text;
  }

  /**
   * 生成户外类推荐文案
   */
  static generateOutdoorRecommendation(candidate, scores, weather) {
    let text = `🌳 推荐户外会面！\n\n`;
      
    const trafficScore = scores.find(s => s.name === '交通便利').score;
    const reputationScore = scores.find(s => s.name === '口碑评价').score;
      
    if (!weather.isRainy && weather.temperature > 15 && weather.temperature < 30) {
      text += '今天天气不错，温度适宜，';
      if (trafficScore > 80) {
        text += '而且交通便利，大家过来都方便，';
      }
      text += '在这里会面既舒适又经济，还能呼吸新鲜空气。';
    } else {
      text += '虽然天气一般，但这里环境优美，空气清新，';
      if (reputationScore > 80) {
        text += '而且人气很高，是个值得一试的休闲好去处。';
      } else {
        text += '适合放松聊天，享受悠闲时光。';
      }
    }
      
    return text;
  }

  /**
   * 生成通用推荐文案
   */
  static generateGeneralRecommendation(candidate, scores, weather) {
    let text = `📍 推荐这个地点！\n\n`;
    
    const bestScore = Math.max(...scores.map(s => s.score));
    const bestFactor = scores.find(s => s.score === bestScore);
    
    text += `综合各方面因素，这里在${bestFactor.name}方面表现突出，`; 
    
    if (weather.condition.includes('晴') || weather.condition.includes('多云')) {
      text += '加上今天天气很好，';
    }
    
    text += '是非常不错的会面选择，相信会给大家带来愉快的体验。';
    
    return text;
  }
}

export default EnhancedAiDecisionService;
