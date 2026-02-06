/**
 * AI 自动决策控制器
 */

const aiAutoDecisionService = require('../services/aiAutoDecisionService');

class AiAutoDecisionController {
    /**
     * 自动决策
     * POST /api/ai/auto-decision
     */
    async autoDecision(req, res) {
        try {
            const { city, districtId, participants, candidates } = req.body;

            const result = await aiAutoDecisionService.decide({
                city,
                districtId,
                participants,
                candidates
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('AI 自动决策失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'AI 自动决策失败'
            });
        }
    }
}

module.exports = new AiAutoDecisionController();