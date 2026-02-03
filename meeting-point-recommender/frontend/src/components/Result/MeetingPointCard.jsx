/**
 * 会面点推荐卡片组件
 */

import './MeetingPointCard.css';

const TRANSPORT_LABELS = {
    walking: '步行',
    bicycling: '骑行',
    transit: '公交',
    driving: '驾车'
};

function MeetingPointCard({ point, rank, selected, onClick }) {
    // 格式化时间
    const formatDuration = (seconds) => {
        if (seconds < 60) {
            return `${seconds}秒`;
        }
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes}分钟`;
        }
        const hours = Math.floor(minutes / 60);
        const remainMinutes = minutes % 60;
        return `${hours}小时${remainMinutes}分钟`;
    };

    // 格式化距离
    const formatDistance = (meters) => {
        if (meters < 1000) {
            return `${meters}米`;
        }
        return `${(meters / 1000).toFixed(1)}公里`;
    };

    return (
        <div
            className={`meeting-point-card ${selected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <div className="card-header">
                <span className="rank">#{rank}</span>
                <div className="point-info">
                    <h3 className="point-name">{point.name || '推荐地点'}</h3>
                    {point.address && (
                        <p className="point-address">{point.address}</p>
                    )}
                </div>
            </div>

            <div className="card-metrics">
                <div className="metric">
                    <span className="metric-label">最大时差</span>
                    <span className="metric-value">{formatDuration(point.metrics.maxTimeDiff)}</span>
                </div>
                <div className="metric">
                    <span className="metric-label">平均用时</span>
                    <span className="metric-value">{formatDuration(point.metrics.avgDuration)}</span>
                </div>
                <div className="metric">
                    <span className="metric-label">总距离</span>
                    <span className="metric-value">{formatDistance(point.metrics.totalDistance)}</span>
                </div>
            </div>

            {selected && point.routeInfos && (
                <div className="route-details">
                    <h4>到达时间明细</h4>
                    {point.routeInfos.map((route, index) => {
                        const maxDuration = Math.max(...point.routeInfos.map(r => r.duration));
                        const widthPercent = (route.duration / maxDuration) * 100;

                        return (
                            <div key={index} className="route-item">
                                <div className="route-person">
                                    <span className="transport-label">
                                        {TRANSPORT_LABELS[route.transportMode]}
                                    </span>
                                    <span className="person-name">{route.personName}</span>
                                </div>
                                <div className="route-bar-wrapper">
                                    <div
                                        className="route-bar"
                                        style={{ width: `${widthPercent}%` }}
                                    />
                                </div>
                                <div className="route-time">
                                    {formatDuration(route.duration)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default MeetingPointCard;
