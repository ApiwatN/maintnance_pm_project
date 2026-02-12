"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSocket } from "../components/SocketProvider";
import { useAuth } from "../../context/AuthContext";
import RescheduleModal from "../components/RescheduleModal";
import ActionPopover from "../components/ActionPopover";
import Swal from 'sweetalert2';

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

interface Holiday {
    id: number;
    date: string;
    name: string;
    description?: string;
    isRecurring?: boolean;
    repeatEveryDays?: number;
    repeatStartDate?: string;
    repeatEndDate?: string;
}

interface UserDateMark {
    id: number;
    date: string;
    color: string;
    note?: string;
    isRecurring?: boolean;
    repeatEveryDays?: number;
    repeatStartDate?: string;
    repeatEndDate?: string;
}

// Pastel colors for user marks (excluding red which is for admin holidays)
const USER_MARK_COLORS = [
    { hex: '#FFE0B2', name: 'ส้มอ่อน' },
    { hex: '#FFF9C4', name: 'เหลืองอ่อน' },
    { hex: '#C8E6C9', name: 'เขียวอ่อน' },
    { hex: '#BBDEFB', name: 'ฟ้าอ่อน' },
    { hex: '#E1BEE7', name: 'ม่วงอ่อน' },
];

export default function CalendarPage() {
    const { socket } = useSocket();
    const { loading: authLoading, user } = useAuth();
    const [events, setEvents] = useState<PMEvent[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [selectedDateEvents, setSelectedDateEvents] = useState<{ date: Date, events: PMEvent[] } | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const router = useRouter();

    // Holiday states
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [holidayModal, setHolidayModal] = useState<{
        show: boolean;
        date: Date | null;
        existingHoliday: Holiday | null;
    }>({ show: false, date: null, existingHoliday: null });
    const [holidayName, setHolidayName] = useState('');
    const [holidayDesc, setHolidayDesc] = useState('');
    const [savingHoliday, setSavingHoliday] = useState(false);
    // Recurring fields for holiday
    const [holidayRecurring, setHolidayRecurring] = useState(false);
    const [holidayRepeatDays, setHolidayRepeatDays] = useState<number>(7);
    const [holidayRepeatStart, setHolidayRepeatStart] = useState('');
    const [holidayRepeatEnd, setHolidayRepeatEnd] = useState('');

    // User Date Mark states
    const [userMarks, setUserMarks] = useState<UserDateMark[]>([]);
    const [dateMarkModal, setDateMarkModal] = useState<{
        show: boolean;
        date: Date | null;
        existingMark: UserDateMark | null;
    }>({ show: false, date: null, existingMark: null });
    const [markColor, setMarkColor] = useState(USER_MARK_COLORS[0].hex);
    const [markNote, setMarkNote] = useState('');
    const [markRecurring, setMarkRecurring] = useState(false);
    const [markRepeatDays, setMarkRepeatDays] = useState<number>(7);
    const [markRepeatStart, setMarkRepeatStart] = useState('');
    const [markRepeatEnd, setMarkRepeatEnd] = useState('');
    const [savingMark, setSavingMark] = useState(false);

    const isAdmin = user?.systemRole === 'ADMIN';

    // Permission-based states
    const [rescheduleModal, setRescheduleModal] = useState<{
        show: boolean;
        machineId: number;
        machineName: string;
        preventiveTypeId: number;
        preventiveTypeName: string;
        currentDate?: string;
    }>({ show: false, machineId: 0, machineName: '', preventiveTypeId: 0, preventiveTypeName: '' });

    const [popover, setPopover] = useState<{
        show: boolean;
        anchorRect: { top: number; left: number; width: number; height: number } | null;
        event: PMEvent | null;
    }>({ show: false, anchorRect: null, event: null });

    useEffect(() => {
        if (!authLoading) {
            fetchSchedule();
            fetchHolidays();
            fetchUserMarks();
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

    const fetchHolidays = () => {
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();
        axios.get(`${config.apiServer}/api/holidays?month=${month}&year=${year}`)
            .then(res => setHolidays(res.data || []))
            .catch(err => console.error('Holidays Error:', err));
    };

    const getHolidayForDate = (date: Date): Holiday | undefined => {
        return holidays.find(h => {
            const holidayDate = new Date(h.date);
            return holidayDate.getDate() === date.getDate() &&
                holidayDate.getMonth() === date.getMonth() &&
                holidayDate.getFullYear() === date.getFullYear();
        });
    };

    const fetchUserMarks = () => {
        if (!user) return;
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();
        axios.get(`${config.apiServer}/api/date-marks?month=${month}&year=${year}`)
            .then(res => setUserMarks(res.data || []))
            .catch(err => console.error('User Marks Error:', err));
    };

    const getUserMarkForDate = (date: Date): UserDateMark | undefined => {
        return userMarks.find(m => {
            const markDate = new Date(m.date);
            return markDate.getDate() === date.getDate() &&
                markDate.getMonth() === date.getMonth() &&
                markDate.getFullYear() === date.getFullYear();
        });
    };

    // Handle date number click - Admin: Holiday, User: Personal Mark
    const handleDateClick = (date: Date) => {
        console.log('handleDateClick called', { date, user, isAdmin, systemRole: user?.systemRole });
        if (isAdmin) {
            // Admin: Open Holiday Modal
            const dayOfWeek = date.getDay();
            let defaultName = '';
            if (dayOfWeek === 0) defaultName = 'Sun';
            if (dayOfWeek === 6) defaultName = 'Sat';

            const existing = getHolidayForDate(date);
            setHolidayName(existing?.name || defaultName);
            setHolidayDesc(existing?.description || '');
            setHolidayRecurring(existing?.isRecurring || false);
            setHolidayRepeatDays(existing?.repeatEveryDays || 7);
            setHolidayRepeatStart(existing?.repeatStartDate?.split('T')[0] || date.toISOString().split('T')[0]);
            setHolidayRepeatEnd(existing?.repeatEndDate?.split('T')[0] || '');
            setHolidayModal({ show: true, date, existingHoliday: existing || null });
        } else if (user) {
            // User: Open Date Mark Modal
            const existing = getUserMarkForDate(date);
            setMarkColor(existing?.color || USER_MARK_COLORS[0].hex);
            setMarkNote(existing?.note || '');
            setMarkRecurring(existing?.isRecurring || false);
            setMarkRepeatDays(existing?.repeatEveryDays || 7);
            setMarkRepeatStart(existing?.repeatStartDate?.split('T')[0] || date.toISOString().split('T')[0]);
            setMarkRepeatEnd(existing?.repeatEndDate?.split('T')[0] || '');
            setDateMarkModal({ show: true, date, existingMark: existing || null });
        }
    };

    const handleSaveDateMark = async () => {
        if (!dateMarkModal.date) return;
        setSavingMark(true);
        try {
            await axios.post(`${config.apiServer}/api/date-marks`, {
                date: dateMarkModal.date.toISOString(),
                color: markColor,
                note: markNote.trim() || null,
                isRecurring: markRecurring,
                repeatEveryDays: markRecurring ? markRepeatDays : null,
                repeatStartDate: markRecurring ? markRepeatStart : null,
                repeatEndDate: markRecurring ? markRepeatEnd : null
            });
            fetchUserMarks();
            setDateMarkModal({ show: false, date: null, existingMark: null });
            Swal.fire({
                title: 'บันทึกสำเร็จ!',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false
            });
        } catch (err: any) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: err.response?.data?.error || 'ไม่สามารถบันทึกได้',
                icon: 'error'
            });
        } finally {
            setSavingMark(false);
        }
    };

    const handleDeleteDateMark = async () => {
        if (!dateMarkModal.existingMark) return;

        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: 'ต้องการลบ Mark นี้หรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        });

        if (!result.isConfirmed) return;

        setSavingMark(true);
        try {
            await axios.delete(`${config.apiServer}/api/date-marks/${dateMarkModal.existingMark.id}`);
            fetchUserMarks();
            setDateMarkModal({ show: false, date: null, existingMark: null });
            Swal.fire({
                title: 'ลบสำเร็จ!',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถลบได้',
                icon: 'error'
            });
        } finally {
            setSavingMark(false);
        }
    };

    const handleSaveHoliday = async () => {
        if (!holidayModal.date || !holidayName.trim()) return;
        setSavingHoliday(true);
        try {
            if (holidayModal.existingHoliday) {
                // Update existing
                await axios.put(`${config.apiServer}/api/holidays/${holidayModal.existingHoliday.id}`, {
                    name: holidayName.trim(),
                    description: holidayDesc.trim() || null,
                    isRecurring: holidayRecurring,
                    repeatEveryDays: holidayRecurring ? holidayRepeatDays : null,
                    repeatStartDate: holidayRecurring ? holidayRepeatStart : null,
                    repeatEndDate: holidayRecurring ? holidayRepeatEnd : null
                });
            } else {
                // Create new
                await axios.post(`${config.apiServer}/api/holidays`, {
                    date: holidayModal.date.toISOString(),
                    name: holidayName.trim(),
                    description: holidayDesc.trim() || null,
                    isRecurring: holidayRecurring,
                    repeatEveryDays: holidayRecurring ? holidayRepeatDays : null,
                    repeatStartDate: holidayRecurring ? holidayRepeatStart : null,
                    repeatEndDate: holidayRecurring ? holidayRepeatEnd : null
                });
            }
            fetchHolidays();
            setHolidayModal({ show: false, date: null, existingHoliday: null });
            Swal.fire({
                title: 'บันทึกสำเร็จ!',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false
            });
        } catch (err: any) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: err.response?.data?.error || 'ไม่สามารถบันทึกได้',
                icon: 'error'
            });
        } finally {
            setSavingHoliday(false);
        }
    };

    const handleDeleteHoliday = async () => {
        if (!holidayModal.existingHoliday) return;

        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: `ต้องการลบวันหยุด "${holidayModal.existingHoliday.name}" หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        });

        if (!result.isConfirmed) return;

        setSavingHoliday(true);
        try {
            await axios.delete(`${config.apiServer}/api/holidays/${holidayModal.existingHoliday.id}`);
            fetchHolidays();
            setHolidayModal({ show: false, date: null, existingHoliday: null });
            Swal.fire({
                title: 'ลบสำเร็จ!',
                text: 'ลบวันหยุดเรียบร้อยแล้ว',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถลบวันหยุดได้',
                icon: 'error'
            });
        } finally {
            setSavingHoliday(false);
        }
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

    // Check user permission for machine
    const canAccessMachine = (machineId: number) => {
        if (!user) return false;
        if (user.systemRole === 'ADMIN') return true;
        if (!user.assignedMachines || user.assignedMachines.length === 0) return false;
        return user.assignedMachines.some(m => m.id === machineId);
    };

    const getUserPermission = () => {
        if (!user) return 'PM_ONLY';
        if (user.systemRole === 'ADMIN') return 'PM_AND_RESCHEDULE';
        return user.permissionType || 'PM_ONLY';
    };

    const handleEventClick = (event: PMEvent, e?: React.MouseEvent) => {
        if (event.type === 'completed') {
            // For completed PM, navigate to inspection form in view-only mode
            const recordId = event.id.replace('record-', '');
            router.push(`/pm/inspect/${recordId}?mode=view&returnTo=/calendar`);
            return;
        }

        if (event.type !== 'upcoming' && event.type !== 'overdue' && event.type !== 'scheduled') {
            return; // Only upcoming, overdue, scheduled are clickable
        }

        // For scheduled type - only users with reschedule permission can click
        if (event.type === 'scheduled') {
            const permission = getUserPermission();
            const canReschedule = permission === 'RESCHEDULE_ONLY' || permission === 'PM_AND_RESCHEDULE' || user?.systemRole === 'ADMIN';
            if (!canReschedule) {
                return; // No reschedule permission
            }
            // Check if user can access this machine
            if (!canAccessMachine(event.machine.id)) {
                return; // No access
            }
            // Open reschedule modal directly for scheduled type
            const parts = event.id.split('-');
            const typeId = parts.length >= 3 ? parseInt(parts[2]) : 0;
            setRescheduleModal({
                show: true,
                machineId: event.machine.id,
                machineName: event.machine.name,
                preventiveTypeId: typeId,
                preventiveTypeName: event.preventiveType?.name || '-',
                currentDate: event.date
            });
            return;
        }

        // Check if user can access this machine
        if (!canAccessMachine(event.machine.id)) {
            return; // No access
        }

        const permission = getUserPermission();
        const parts = event.id.split('-');
        const typeId = parts.length >= 3 ? parseInt(parts[2]) : 0;

        if (permission === 'PM_ONLY') {
            // Direct to PM inspection
            const query = typeId ? `?typeId=${typeId}&returnTo=/calendar` : `?returnTo=/calendar`;
            router.push(`/pm/inspect/${event.machine.id}${query}`);
        } else if (permission === 'RESCHEDULE_ONLY') {
            // Show reschedule modal
            setRescheduleModal({
                show: true,
                machineId: event.machine.id,
                machineName: event.machine.name,
                preventiveTypeId: typeId,
                preventiveTypeName: event.preventiveType?.name || '-',
                currentDate: event.date
            });
        } else {
            // PM_AND_RESCHEDULE or ADMIN - show popover
            if (e) {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setPopover({
                    show: true,
                    anchorRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
                    event
                });
            }
        }
    };

    const handlePopoverInspect = () => {
        if (!popover.event) return;
        const parts = popover.event.id.split('-');
        const typeId = parts.length >= 3 ? parts[2] : null;
        const query = typeId ? `?typeId=${typeId}&returnTo=/calendar` : `?returnTo=/calendar`;
        router.push(`/pm/inspect/${popover.event.machine.id}${query}`);
    };

    const handlePopoverReschedule = () => {
        if (!popover.event) return;
        const parts = popover.event.id.split('-');
        const typeId = parts.length >= 3 ? parseInt(parts[2]) : 0;
        setRescheduleModal({
            show: true,
            machineId: popover.event.machine.id,
            machineName: popover.event.machine.name,
            preventiveTypeId: typeId,
            preventiveTypeName: popover.event.preventiveType?.name || '-',
            currentDate: popover.event.date
        });
    };

    const renderEventBadge = (event: PMEvent, idx: number, isModal: boolean = false) => {
        const eventColor = getEventColor(event);
        // Check if scheduled type is clickable based on permission
        const permission = getUserPermission();
        const canReschedule = permission === 'RESCHEDULE_ONLY' || permission === 'PM_AND_RESCHEDULE' || user?.systemRole === 'ADMIN';
        const isClickable = event.type !== 'scheduled' || (event.type === 'scheduled' && canReschedule);

        return (
            <div
                key={idx}
                className={`${eventColor} rounded px-1 small shadow-sm mb-1`}
                title={`${event.machine?.name || 'Unknown'} - ${getEventLabel(event)}${isClickable ? '\nคลิกเพื่อดูรายละเอียด' : ''}`}
                onClick={(e: React.MouseEvent) => {
                    if (isClickable) {
                        e.stopPropagation();
                        handleEventClick(event, e);
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
                <div key={`empty-${i}`} className="calendar-day border-end border-bottom bg-light"></div>
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
            const holiday = getHolidayForDate(date);
            const isHoliday = !!holiday;
            const userMark = getUserMarkForDate(date);
            const MAX_VISIBLE_EVENTS = 2;
            const extraCount = dayEvents.length - MAX_VISIBLE_EVENTS;

            // Background priority: Holiday (red) > User Mark (user color) > Today (blue) > Default
            let bgStyle: React.CSSProperties = {};
            if (isHoliday) {
                // Admin Holiday always wins - red background (25% opacity)
                bgStyle = { backgroundColor: 'rgba(220, 53, 69, 0.25)' };
            } else if (userMark) {
                // User mark - use user's color with opacity (45% = hex 73)
                bgStyle = { backgroundColor: userMark.color + '73' };
            } else if (isToday) {
                bgStyle = { backgroundColor: 'rgba(13, 110, 253, 0.15)' };
            }

            days.push(
                <div
                    key={i}
                    className={`calendar-day border-end border-bottom p-2`}
                    style={{ cursor: 'pointer', ...bgStyle }}
                    onClick={() => {
                        if (dayEvents.length > 0) {
                            setSelectedDateEvents({ date, events: dayEvents });
                        }
                    }}
                >
                    <div className="d-flex align-items-center mb-2">
                        <span
                            className={`fw-bold ${user ? 'text-primary' : ''} ${isToday ? 'text-primary' : ''}`}
                            style={{ cursor: user ? 'pointer' : 'default' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDateClick(date);
                            }}
                            title={isAdmin ? 'คลิกเพื่อกำหนดวันหยุด' : (user ? 'คลิกเพื่อ Mark วัน' : '')}
                        >
                            {i}
                        </span>
                        {isToday && <span className="ms-2 badge bg-primary rounded-pill" style={{ fontSize: '0.6em' }}>วันนี้</span>}
                        {isHoliday && <span className="ms-2 badge bg-danger rounded-pill" style={{ fontSize: '0.6em' }}>{holiday.name}</span>}
                        {userMark && userMark.note && (
                            <span className="ms-2 badge rounded-pill" style={{ fontSize: '0.6em', backgroundColor: userMark.color, color: '#333' }} title={userMark.note}>
                                📝
                            </span>
                        )}
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
        <div className="container-fluid py-3 bg-light position-relative" style={{ height: 'calc(100dvh - 56px)', overflow: 'hidden' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-0">
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
                            <span className="badge px-3 py-2" style={{ backgroundColor: 'rgba(220, 53, 69, 0.15)', color: '#dc3545' }}>🔴 วันหยุด</span>
                        </div>
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
            <div className="card border-0 shadow-sm rounded-3 calendar-container">
                <div className="card-body p-0 d-flex flex-column h-100">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="calendar-grid h-100">
                            {/* Header row */}
                            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((day, idx) => (
                                <div
                                    key={day}
                                    className={`bg-light border-end border-bottom p-2 fw-bold text-center ${idx === 0 || idx === 6 ? 'text-primary' : 'text-secondary'}`}
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

            {/* Reschedule Modal */}
            <RescheduleModal
                show={rescheduleModal.show}
                onClose={() => setRescheduleModal({ ...rescheduleModal, show: false })}
                machineId={rescheduleModal.machineId}
                machineName={rescheduleModal.machineName}
                preventiveTypeId={rescheduleModal.preventiveTypeId}
                preventiveTypeName={rescheduleModal.preventiveTypeName}
                currentDate={rescheduleModal.currentDate}
                onSuccess={fetchSchedule}
            />

            {/* Action Popover */}
            <ActionPopover
                show={popover.show}
                anchorRect={popover.anchorRect}
                onClose={() => setPopover({ show: false, anchorRect: null, event: null })}
                onInspect={handlePopoverInspect}
                onReschedule={handlePopoverReschedule}
            />

            {/* Holiday Modal (Admin Only) */}
            {holidayModal.show && holidayModal.date && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="card shadow-lg border-0 rounded-3" style={{ width: '450px', maxHeight: '90vh', overflow: 'auto' }}>
                        <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center py-3">
                            <h5 className="mb-0 fw-bold">
                                <i className="bi bi-calendar-x me-2"></i>
                                {holidayModal.date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={() => setHolidayModal({ show: false, date: null, existingHoliday: null })}></button>
                        </div>
                        <div className="card-body p-4">
                            {holidayModal.existingHoliday && (
                                <div className="alert alert-danger d-flex justify-content-between align-items-center mb-3">
                                    <span><strong>วันหยุด:</strong> {holidayModal.existingHoliday.name}</span>
                                    <button className="btn btn-sm btn-outline-danger" onClick={handleDeleteHoliday} disabled={savingHoliday}>
                                        <i className="bi bi-trash"></i> ลบ
                                    </button>
                                </div>
                            )}
                            <div className="mb-3">
                                <label className="form-label fw-bold">ชื่อวันหยุด <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={holidayName}
                                    onChange={(e) => setHolidayName(e.target.value)}
                                    placeholder="เช่น วันปีใหม่, Sat, Sun"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">รายละเอียด</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={holidayDesc}
                                    onChange={(e) => setHolidayDesc(e.target.value)}
                                    placeholder="(ไม่บังคับ)"
                                />
                            </div>
                            {/* Recurring Options */}
                            <div className="border rounded p-3 bg-light">
                                <div className="form-check mb-2">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="holidayRecurring"
                                        checked={holidayRecurring}
                                        onChange={(e) => setHolidayRecurring(e.target.checked)}
                                    />
                                    <label className="form-check-label fw-bold" htmlFor="holidayRecurring">
                                        <i className="bi bi-arrow-repeat me-1"></i> ซ้ำเป็นประจำ
                                    </label>
                                </div>
                                {holidayRecurring && (
                                    <div className="ms-4 mt-2">
                                        <div className="mb-2">
                                            <label className="form-label small">ซ้ำทุก</label>
                                            <div className="input-group input-group-sm">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={holidayRepeatDays}
                                                    onChange={(e) => setHolidayRepeatDays(parseInt(e.target.value) || 1)}
                                                    min={1}
                                                />
                                                <span className="input-group-text">วัน</span>
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label small">เริ่มวันที่</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                value={holidayRepeatStart}
                                                onChange={(e) => setHolidayRepeatStart(e.target.value)}
                                            />
                                        </div>
                                        <div className="mb-0">
                                            <label className="form-label small">สิ้นสุดวันที่</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                value={holidayRepeatEnd}
                                                onChange={(e) => setHolidayRepeatEnd(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="card-footer bg-light d-flex justify-content-end gap-2">
                            <button className="btn btn-secondary" onClick={() => setHolidayModal({ show: false, date: null, existingHoliday: null })}>ปิด</button>
                            <button className="btn btn-danger" onClick={handleSaveHoliday} disabled={savingHoliday || !holidayName.trim()}>
                                {savingHoliday ? <><span className="spinner-border spinner-border-sm me-2"></span>กำลังบันทึก...</> : <><i className="bi bi-check-lg me-1"></i>บันทึก</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Date Mark Modal */}
            {dateMarkModal.show && dateMarkModal.date && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="card shadow-lg border-0 rounded-3" style={{ width: '450px', maxHeight: '90vh', overflow: 'auto' }}>
                        <div className="card-header text-white d-flex justify-content-between align-items-center py-3" style={{ backgroundColor: markColor }}>
                            <h5 className="mb-0 fw-bold" style={{ color: '#333' }}>
                                <i className="bi bi-pin-fill me-2"></i>
                                Mark วัน {dateMarkModal.date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h5>
                            <button type="button" className="btn-close" onClick={() => setDateMarkModal({ show: false, date: null, existingMark: null })}></button>
                        </div>
                        <div className="card-body p-4">
                            {dateMarkModal.existingMark && (
                                <div className="alert d-flex justify-content-between align-items-center mb-3" style={{ backgroundColor: dateMarkModal.existingMark.color }}>
                                    <span style={{ color: '#333' }}><strong>มี Mark อยู่แล้ว</strong></span>
                                    <button className="btn btn-sm btn-outline-dark" onClick={handleDeleteDateMark} disabled={savingMark}>
                                        <i className="bi bi-trash"></i> ลบ
                                    </button>
                                </div>
                            )}
                            {/* Color Picker */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">เลือกสี</label>
                                <div className="d-flex gap-2 flex-wrap">
                                    {USER_MARK_COLORS.map((color) => (
                                        <button
                                            key={color.hex}
                                            type="button"
                                            className={`btn rounded-circle p-0 ${markColor === color.hex ? 'border-3 border-dark' : 'border-2 border-secondary'}`}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                backgroundColor: color.hex,
                                                boxShadow: markColor === color.hex ? '0 0 0 3px rgba(0,0,0,0.3)' : 'none'
                                            }}
                                            onClick={() => setMarkColor(color.hex)}
                                            title={color.name}
                                        />
                                    ))}
                                    <button
                                        type="button"
                                        className={`btn rounded-circle p-0 border-2 border-secondary d-flex align-items-center justify-content-center`}
                                        style={{ width: '40px', height: '40px', backgroundColor: '#fff' }}
                                        onClick={() => {
                                            setMarkColor('');
                                            if (dateMarkModal.existingMark) {
                                                handleDeleteDateMark();
                                            } else {
                                                setDateMarkModal({ show: false, date: null, existingMark: null });
                                            }
                                        }}
                                        title="ลบสี"
                                    >
                                        <i className="bi bi-x-lg text-danger"></i>
                                    </button>
                                </div>
                            </div>
                            {/* Note */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">หมายเหตุ</label>
                                <textarea
                                    className="form-control"
                                    rows={2}
                                    value={markNote}
                                    onChange={(e) => setMarkNote(e.target.value)}
                                    placeholder="(ไม่บังคับ)"
                                />
                            </div>
                            {/* Recurring Options */}
                            <div className="border rounded p-3 bg-light">
                                <div className="form-check mb-2">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="markRecurring"
                                        checked={markRecurring}
                                        onChange={(e) => setMarkRecurring(e.target.checked)}
                                    />
                                    <label className="form-check-label fw-bold" htmlFor="markRecurring">
                                        <i className="bi bi-arrow-repeat me-1"></i> ซ้ำเป็นประจำ
                                    </label>
                                </div>
                                {markRecurring && (
                                    <div className="ms-4 mt-2">
                                        <div className="mb-2">
                                            <label className="form-label small">ซ้ำทุก</label>
                                            <div className="input-group input-group-sm">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={markRepeatDays}
                                                    onChange={(e) => setMarkRepeatDays(parseInt(e.target.value) || 1)}
                                                    min={1}
                                                />
                                                <span className="input-group-text">วัน</span>
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label small">เริ่มวันที่</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                value={markRepeatStart}
                                                onChange={(e) => setMarkRepeatStart(e.target.value)}
                                            />
                                        </div>
                                        <div className="mb-0">
                                            <label className="form-label small">สิ้นสุดวันที่</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                value={markRepeatEnd}
                                                onChange={(e) => setMarkRepeatEnd(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="card-footer bg-light d-flex justify-content-end gap-2">
                            <button className="btn btn-secondary" onClick={() => setDateMarkModal({ show: false, date: null, existingMark: null })}>ปิด</button>
                            <button className="btn btn-primary" onClick={handleSaveDateMark} disabled={savingMark || !markColor}>
                                {savingMark ? <><span className="spinner-border spinner-border-sm me-2"></span>กำลังบันทึก...</> : <><i className="bi bi-check-lg me-1"></i>บันทึก</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
