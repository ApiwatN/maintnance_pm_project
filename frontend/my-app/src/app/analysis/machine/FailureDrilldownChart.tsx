"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import config from "../../config";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface DrilldownState {
    level: string;
    data: any[];
    title: string;
}

export default function FailureDrilldownChart({ year }: { year: string }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<DrilldownState[]>([]);
    const [currentLevel, setCurrentLevel] = useState<string>('AREA');
    const [title, setTitle] = useState('Common Failure Topics');

    // Use refs to capture current state for history (avoid stale closure)
    const dataRef = useRef(data);
    const levelRef = useRef(currentLevel);
    const titleRef = useRef(title);

    useEffect(() => { dataRef.current = data; }, [data]);
    useEffect(() => { levelRef.current = currentLevel; }, [currentLevel]);
    useEffect(() => { titleRef.current = title; }, [title]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<any>(null);

    useEffect(() => {
        // Initial Fetch (Reset when year changes)
        fetchData('AREA', null, false);
        setHistory([]);
    }, [year]);

    const fetchData = async (level: string, parentId: any, pushToHistory: boolean) => {
        // Save current state BEFORE fetching (using refs for latest values)
        const prevState: DrilldownState | null = pushToHistory ? {
            level: levelRef.current,
            data: [...dataRef.current],
            title: titleRef.current
        } : null;

        setLoading(true);
        try {
            const res = await axios.get(`${config.apiServer}/api/pm/analysis/failure-breakdown`, {
                params: { year, level, parentId }
            });

            const resultData = res.data;

            if (resultData.length > 0) {
                const actualLevel = resultData[0].level; // Backend might auto-skip to TYPE

                // Update Title based on Level
                let newTitle = '';
                switch (actualLevel) {
                    case 'AREA': newTitle = 'Failures by Area'; break;
                    case 'TYPE': newTitle = 'Failures by Machine Type'; break;
                    case 'MACHINE': newTitle = 'Failures by Machine'; break;
                    case 'TOPIC': newTitle = 'Failure Topics'; break;
                    default: newTitle = 'Common Failure Topics';
                }

                // Push previous state to history BEFORE updating
                if (prevState) {
                    setHistory(prev => [...prev, prevState]);
                }

                setCurrentLevel(actualLevel);
                setData(resultData);
                setTitle(newTitle);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Drilldown fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBarClick = (entry: any) => {
        if (!entry || !entry.payload) return;
        const payload = entry.payload || entry;

        console.log('[Drilldown] Bar clicked:', payload);

        // Determine next move
        if (payload.level === 'AREA') {
            fetchData('TYPE', payload.id, true);
        } else if (payload.level === 'TYPE') {
            fetchData('MACHINE', payload.id, true);
        } else if (payload.level === 'MACHINE') {
            fetchData('TOPIC', payload.id, true);
        } else if (payload.level === 'TOPIC') {
            // Show Details Modal
            setSelectedTopic(payload);
            setShowModal(true);
        }
    };

    const handleBack = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];

        setData(lastState.data);
        setCurrentLevel(lastState.level);
        setTitle(lastState.title);

        setHistory(prev => prev.slice(0, -1));
    };

    if (loading && data.length === 0) {
        return <div className="text-center py-5"><div className="spinner-border text-secondary"></div></div>;
    }

    return (
        <div className="h-100 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="card-title mb-0">{title}</h5>
                {history.length > 0 && (
                    <button className="btn btn-sm btn-outline-secondary" onClick={handleBack}>
                        <i className="bi bi-arrow-left me-1"></i> Back
                    </button>
                )}
            </div>

            {data.length === 0 && !loading ? (
                <div className="text-center text-muted py-5">No failure data found.</div>
            ) : (
                <div style={{ flexGrow: 1, minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Bar
                                dataKey="value"
                                name="Frequency"
                                fill="#ffc107"
                                cursor="pointer"
                                onClick={handleBarClick}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.level === 'TOPIC' ? '#dc3545' : '#ffc107'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Modal for Details */}
            {showModal && selectedTopic && (
                <div className="modal show d-block" tabIndex={-1} style={{
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050
                }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Details: {selectedTopic.name}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-2"><strong>Total Occurrences:</strong> {selectedTopic.value}</p>
                                <div className="table-responsive">
                                    <table className="table table-striped table-hover table-sm">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Check By</th>
                                                <th>Remark</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedTopic.occurrences?.map((occ: any, i: number) => (
                                                <tr key={i}>
                                                    <td>{new Date(occ.date).toLocaleDateString()}</td>
                                                    <td>{occ.inspector || '-'}</td>
                                                    <td>{occ.remark || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
