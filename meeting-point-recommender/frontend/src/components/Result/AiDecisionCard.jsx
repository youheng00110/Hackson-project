/**
 * AI 决策结果卡片
 */

import './AiDecisionCard.css';

function AiDecisionCard({ content }) {
    if (!content) return null;

    const lines = content.split('\n');

    const renderLine = (line, index) => {
        if (!line.trim()) {
            return <div key={`empty-${index}`} className="ai-line-spacer" />;
        }

        if (line.startsWith('## ')) {
            return (
                <h3 key={`title-${index}`} className="ai-line-title">
                    {line.replace('## ', '')}
                </h3>
            );
        }

        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
            return (
                <div key={`strong-${index}`} className="ai-line-strong">
                    <strong>{line.replace(/^\*\*|\*\*$/g, '')}</strong>
                </div>
            );
        }

        if (line.startsWith('• ')) {
            return (
                <div key={`bullet-${index}`} className="ai-line-bullet">
                    {line}
                </div>
            );
        }

        return (
            <div key={`text-${index}`} className="ai-line-text">
                {line}
            </div>
        );
    };

    return (
        <div className="ai-decision-card">
            <div className="ai-card-header">
                <span className="ai-card-title">AI 推荐说明</span>
            </div>
            <div className="ai-card-content">
                {lines.map(renderLine)}
            </div>
        </div>
    );
}

export default AiDecisionCard;