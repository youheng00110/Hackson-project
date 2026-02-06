/**
 * 人员列表组件 - 支持编辑功能
 */

import { useState } from 'react';
import './PersonList.css';

const TRANSPORT_LABELS = {
    walking: '步行',
    bicycling: '骑行',
    transit: '公共交通',
    public_transport: '公共交通',
    driving: '驾车'
};

const TRANSPORT_MODES = [
    { value: 'walking', label: '步行' },
    { value: 'bicycling', label: '骑行' },
    { value: 'public_transport', label: '公共交通' },
    { value: 'driving', label: '驾车' }
];

function PersonList({ persons, onRemove, onUpdate }) {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // 开始编辑
    const handleStartEdit = (person) => {
        setEditingId(person.id);
        setEditForm({
            name: person.name,
            transportMode: person.transportMode
        });
    };

    // 取消编辑
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    // 保存编辑
    const handleSaveEdit = (person) => {
        if (onUpdate) {
            onUpdate(person.id, {
                ...person,
                name: editForm.name,
                transportMode: editForm.transportMode
            });
        }
        setEditingId(null);
        setEditForm({});
    };

    if (persons.length === 0) {
        return (
            <div className="person-list empty">
                <p>暂无人员，请添加人员信息</p>
            </div>
        );
    }

    return (
        <div className="person-list">
            {persons.map((person) => (
                <div key={person.id} className={`person-item ${editingId === person.id ? 'editing' : ''}`}>
                    {editingId === person.id ? (
                        // 编辑模式
                        <div className="person-edit-form">
                            <div className="edit-row">
                                <input
                                    type="text"
                                    className="edit-name-input"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    placeholder="姓名"
                                />
                            </div>
                            <div className="edit-row">
                                <div className="edit-transport-selector">
                                    {TRANSPORT_MODES.map((mode) => (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            className={`edit-transport-btn ${editForm.transportMode === mode.value ? 'active' : ''}`}
                                            onClick={() => setEditForm({ ...editForm, transportMode: mode.value })}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="edit-row location-row">
                                <span className="edit-location">{person.locationName || `${person.lng.toFixed(4)}, ${person.lat.toFixed(4)}`}</span>
                            </div>
                            <div className="edit-actions">
                                <button className="save-btn" onClick={() => handleSaveEdit(person)}>保存</button>
                                <button className="cancel-btn" onClick={handleCancelEdit}>取消</button>
                            </div>
                        </div>
                    ) : (
                        // 显示模式
                        <>
                            <div className="person-info" onClick={() => handleStartEdit(person)}>
                                <div className="person-header">
                                    <span className="person-name">{person.name}</span>
                                    <span className="person-transport">
                                        {TRANSPORT_LABELS[person.transportMode]}
                                    </span>
                                </div>
                                <div className="person-location">
                                    {person.locationName || `${person.lng.toFixed(4)}, ${person.lat.toFixed(4)}`}
                                </div>
                            </div>
                            <div className="person-actions">
                                <button
                                    className="edit-btn"
                                    onClick={() => handleStartEdit(person)}
                                    title="编辑"
                                >
                                    E
                                </button>
                                <button
                                    className="remove-btn"
                                    onClick={() => onRemove(person.id)}
                                    title="删除"
                                >
                                    X
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}

export default PersonList;
