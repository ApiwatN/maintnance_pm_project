"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSocket } from "../components/SocketProvider";
import { useAuth } from "../../context/AuthContext";

interface PMEvent {
    id: string;
    type: 'completed' | 'upcoming' | 'overdue' | 'scheduled';
    date: string;
    machine: {
        id: number;
        name: string;
        code: string;
    };
    status?: string;
    lastCheckStatus?: 'HAS_NG' | 'ALL_OK' | null; // [NEW] Inspection result
    inspector?: string;
    checker?: string;
    daysUntil?: number;
    preventiveType?: { name: string };
}

export default function CalendarPage() {
    const { socket } = useSocket();
    const { loading: authLoading } = useAuth(); // Rename to avoid conflict with local loading state
    const [events, setEvents] = useState<PMEvent[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [selectedDateEvents, setSelectedDateEvents] = useState<{ date: Date, events: PMEvent[] } | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading) {
            fetchSchedule();
        }
    }, [currentMonth, authLoading]);

    // Socket Listener
    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            console.log("Real-time Update: Calendar");
            fetchSchedule();
        };

        socket.on('pm_update', handleUpdate);
        socket.on('machine_update', handleUpdate); // Plan changes affect schedule

        return () => {
            socket.off('pm_update');
            socket.off('machine_update');
        };
    }, [socket, currentMonth]);

    // Load/Save Calendar View
    useEffect(() => {
        const savedDate = localStorage.getItem("calendarViewDate");
        if (savedDate) {
            setCurrentMonth(new Date(savedDate));
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("calendarViewDate", currentMonth.toISOString());
    }, [currentMonth, isLoaded]);

    const fetchSchedule = () => {
        setLoading(true);
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();

        axios.get(`${config.apiServer}/api/pm/schedule?month=${month}&year=${year}&t=${Date.now()}`)
            .then(res => {
                console.log('Calendar Events:', res.data);
                const allEvents: PMEvent[] = res.data || [];

                // Filter to keep only the latest 'completed' event per Machine + PM Type
                const latestCompletedMap = new Map<string, PMEvent>();
                const otherEvents: PMEvent[] = [];

                allEvents.forEach(event => {
                    if (event.type === 'completed') {
                        const key = `${event.machine.id}-${event.preventiveType?.name || 'Unknown'}`;
                        const existing = latestCompletedMap.get(key);

                        if (!existing || new Date(event.date) > new Date(existing.date)) {
                            latestCompletedMap.set(key, event);
                        }
                    } else {
                        otherEvents.push(event);
                    }
                });

                const filteredEvents = [...otherEvents, ...Array.from(latestCompletedMap.values())];
                setEvents(filteredEvents);
                setLoading(false);
            })
            .catch(err => {
                console.error('Calendar Error:', err);
                setLoading(false);
            });
    };

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const getEventColor = (event: PMEvent) => {
        // [NEW] Check for NG status first for completed events
        if (event.type === 'completed' && event.lastCheckStatus === 'HAS_NG') {
            return 'bg-danger text-white'; // Red for NG
        }
        switch (event.type) {
            case 'completed':
                return 'bg-success text-white'; // Green for all OK
            case 'upcoming':
                return 'bg-warning text-dark';
            case 'overdue':
                return 'bg-danger text-white';
            case 'scheduled':
                return 'bg-info text-dark';
            default:
                return 'bg-secondary text-white';
        }
    };

    const getEventLabel = (event: PMEvent) => {
        // [NEW] Check for NG status first for completed events
        if (event.type === 'completed' && event.lastCheckStatus === 'HAS_NG') {
            return '✗ Checked (NG)';
        }
        switch (event.type) {
            case 'completed':
                return '✓ Completed';
            case 'upcoming':
                return '⚠ กำลังจะมาถึง';
            case 'overdue':
                return '⚠ Overdue';
            case 'scheduled':
                return '📅 รอบถัดไป';
            default:
                return '';
        }
    };

    const handleEventClick = (event: PMEvent) => {
        if (event.type === 'completed') {
            // For completed PM, navigate to inspection form in view-only mode
            const recordId = event.id.replace('record-', '');
            router.push(`/pm/inspect/${recordId}?mode=view&returnTo=/calendar`);
        } else if (event.type === 'upcoming' || event.type === 'overdue') {
            // For upcoming/overdue, navigate to inspection form for new PM
            // Extract preventiveTypeId from event.id (format: schedule-machineId-typeId)
            const parts = event.id.split('-');
            const typeId = parts.length >= 3 ? parts[2] : null;

            const query = typeId ? `?typeId=${typeId}&returnTo=/calendar` : `?returnTo=/calendar`;
            router.push(`/pm/inspect/${event.machine.id}${query}`);
        }
        // For 'scheduled' type, do nothing (not clickable)
    };

    const renderEventBadge = (event: PMEvent, idx: number, isModal: boolean = false) => {
        const eventColor = getEventColor(event);
        const isClickable = event.type !== 'scheduled';

        return (
            <div
                key={idx}
                className={`${eventColor} rounded px-2 py-1 small shadow-sm mb-1`}
                title={`${event.machine?.name || 'Unknown'} - ${getEventLabel(event)}${isClickable ? '\nคลิกเพื่อดูรายละเอียด' : ''}`}
                onClick={(e: React.MouseEvent) => {
                    if (isClickable) {
                        e.stopPropagation();
                        handleEventClick(event);
                    }
                }}
                style={{
                    fontSize: isModal ? '0.85rem' : '0.75rem',
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: isClickable ? 'transform 0.15s' : 'none',
                    opacity: isClickable ? 1 : 0.9
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => isClickable && (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => isClickable && (e.currentTarget.style.transform = 'scale(1)')}
            >
                <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-truncate me-2">
                        {event.machine?.name || 'Unknown'} {event.preventiveType?.name ? `(${event.preventiveType.name})` : ''}
                    </span>
                    {isModal && <span className="badge bg-white bg-opacity-25 rounded-pill" style={{ fontSize: '0.6em' }}>{getEventLabel(event)}</span>}
                </div>
            </div>
        );
    };

    const renderCalendar = () => {
        const days = [];

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="border-end border-bottom bg-light" style={{ minHeight: '100px' }}></div>
            );
        }

        // Days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);

            let dayEvents = events.filter(e => {
                const eventDate = new Date(e.date);
                return eventDate.getDate() === i;
            });

            // Deduplicate: Keep latest per Machine + PM Type
            const uniqueEventsMap = new Map<string, PMEvent>();
            dayEvents.forEach(event => {
                const key = `${event.machine.id}-${event.preventiveType?.name || 'Unknown'}`;
                const existing = uniqueEventsMap.get(key);

                if (!existing) {
                    uniqueEventsMap.set(key, event);
                } else {
                    // Priority: Completed (3) > Overdue (2) > Upcoming (1) > Scheduled (0)
                    const getPriority = (e: PMEvent) => {
                        if (e.type === 'completed') return 3;
                        if (e.type === 'overdue') return 2;
                        if (e.type === 'upcoming') return 1;
                        return 0;
                    };

                    const pExisting = getPriority(existing);
                    const pCurrent = getPriority(event);

                    if (pCurrent > pExisting) {
                        uniqueEventsMap.set(key, event);
                    } else if (pCurrent === pExisting) {
                        // If same priority, use ID to break tie (higher ID = later)
                        // Mostly for multiple Completed records
                        const id1 = parseInt(event.id.replace(/\D/g, '')) || 0;
                        const id2 = parseInt(existing.id.replace(/\D/g, '')) || 0;
                        if (id1 > id2) uniqueEventsMap.set(key, event);
                    }
                }
            });

            dayEvents = Array.from(uniqueEventsMap.values());

            const isToday = new Date().toDateString() === date.toDateString();
            const MAX_VISIBLE_EVENTS = 3;
            const extraCount = dayEvents.length - MAX_VISIBLE_EVENTS;

            days.push(
                <div
                    key={i}
                    className={`border-end border-bottom p-2 ${isToday ? 'bg-primary bg-opacity-10' : ''}`}
                    style={{ minHeight: '100px', cursor: 'pointer' }}
                    onClick={() => {
                        if (dayEvents.length > 0) {
                            setSelectedDateEvents({ date, events: dayEvents });
                        }
                    }}
                >
                    <div className={`fw-bold mb-2 ${isToday ? 'text-primary' : ''}`}>
                        {i}
                        {isToday && <span className="ms-2 badge bg-primary rounded-pill" style={{ fontSize: '0.6em' }}>วันนี้</span>}
                    </div>
                    <div className="d-flex flex-column">
                        {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((event, idx) => renderEventBadge(event, idx))}

                        {extraCount > 0 && (
                            <div
                                className="text-center text-primary fw-bold mt-1 p-1 rounded hover-bg-light"
                                style={{ fontSize: '0.75rem', cursor: 'pointer', backgroundColor: 'rgba(13, 110, 253, 0.1)' }}
                            >
                                + {extraCount} รายการ
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    const changeMonth = (offset: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    };

    return (
        <div className="container-fluid py-4 bg-light min-vh-100 position-relative">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">PM Calendar</h2>
                    <p className="text-muted mb-0">ปฏิทินการดูแลรักษาเชิงป้องกัน</p>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <button className="btn btn-light shadow-sm border" onClick={() => changeMonth(-1)}>
                        <i className="bi bi-chevron-left"></i> ย้อนกลับ
                    </button>
                    <span className="fw-bold fs-5 mx-3">
                        {currentMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                    </span>
                    <button className="btn btn-light shadow-sm border" onClick={() => changeMonth(1)}>
                        ถัดไป <i className="bi bi-chevron-right"></i>
                    </button>
                    <Link href="/" className="btn btn-light shadow-sm border ms-3">
                        <i className="bi bi-house me-2"></i>กลับหน้าแรก
                    </Link>
                </div>
            </div>

            {/* Legend */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-body p-3">
                    <div className="row g-2">
                        <div className="col-auto">
                            <span className="badge bg-success text-white px-3 py-2">✓ PM แล้ว</span>
                        </div>
                        <div className="col-auto">
                            <span className="badge bg-warning text-dark px-3 py-2">⚠ กำลังจะมาถึง</span>
                        </div>
                        <div className="col-auto">
                            <span className="badge bg-danger text-white px-3 py-2">⚠ Overdue</span>
                        </div>
                        <div className="col-auto">
                            <span className="badge bg-info text-dark px-3 py-2">📅 รอบถัดไป</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                            {/* Header row */}
                            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((day, idx) => (
                                <div
                                    key={day}
                                    className={`bg-light border-end border-bottom p-3 fw-bold text-center ${idx === 0 || idx === 6 ? 'text-primary' : 'text-secondary'}`}
                                >
                                    {day}
                                </div>
                            ))}
                            {/* Calendar days */}
                            {renderCalendar()}
                        </div>
                    )}
                </div>
            </div>

            {/* Event Details Modal */}
            {selectedDateEvents && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="card shadow-lg border-0 rounded-3" style={{ width: '500px', maxHeight: '80vh' }}>
                        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-3">
                            <h5 className="mb-0 fw-bold">
                                {selectedDateEvents.date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedDateEvents(null)}></button>
                        </div>
                        <div className="card-body overflow-auto p-4 custom-scrollbar">
                            <h6 className="text-muted mb-3">
                                งานทั้งหมด: {selectedDateEvents.events.length} รายการ
                            </h6>
                            <div className="d-flex flex-column gap-2">
                                {selectedDateEvents.events.map((event, idx) => renderEventBadge(event, idx, true))}
                            </div>
                        </div>
                        <div className="card-footer bg-light text-end">
                            <button className="btn btn-secondary" onClick={() => setSelectedDateEvents(null)}>ปิด</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
