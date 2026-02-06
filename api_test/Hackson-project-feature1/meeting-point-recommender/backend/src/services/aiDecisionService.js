/**
 * AI 决策助手服务
 */

const axios = require('axios');

const SYSTEM_PROMPT = `角色
多人会面点智能决策助手。

目标
结合候选点信息、实时路况、实时天气，并参考“口碑/品牌/综合体属性”等因素，给出更贴近日常沟通的建议。

决策偏好
1) 路况权重最高：总通行时间更短、拥堵更低优先。
2) 天气适配：雨天/大风/高温/低温优先室内商圈、近地铁、停车便利。
3) 口碑/综合体：知名商圈/大型商业体/连锁品牌适当加分，避免政务/单位类地点。

输出要求
不必死板遵循固定模板，但请输出：
- 最优候选点
- 推荐排序（Top5）
- 每个点一句人性化理由（结合路况/天气/口碑）
- 一段简短自然语言总结

风格
简洁、人性化、可直接给人阅读。`;

class AiDecisionService {
    async decide(input) {
        const apiKey = process.env.DASHSCOPE_API_KEY;
        if (!apiKey) {
            throw new Error('DASHSCOPE_API_KEY 未配置');
        }

        const baseUrl = process.env.DASHSCOPE_API_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
        const model = process.env.AI_MODEL || 'qwen-plus';

        const response = await axios.post(
            `${baseUrl}/chat/completions`,
            {
                model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: input }
                ],
                temperature: 0.2
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('AI 返回为空');
        }

        return content;
    }
}

module.exports = new AiDecisionService();
