/**
 * AI 决策助手控制器
 */

const aiDecisionService = require('../services/aiDecisionService');

class AiController {
    /**
     * AI 决策
     * POST /api/ai/decision
     */
    async decision(req, res) {
        try {
            const { input } = req.body;

            if (!input || typeof input !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: '请提供 input 字符串'
                });
            }

            const result = await aiDecisionService.decide(input);

            res.json({
                success: true,
                data: {
                    output: result
                }
            });
        } catch (error) {
            console.error('AI 决策失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'AI 决策失败'
            });
        }
    }
}

module.exports = new AiController();
