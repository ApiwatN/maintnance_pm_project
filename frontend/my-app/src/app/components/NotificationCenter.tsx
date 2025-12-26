"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { fetchNotifications, requestNotificationPermission, showSystemNotification, NotificationItem } from '../utils/notifications';

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    // const [showToast, setShowToast] = useState(false); // REMOVED: Custom Toast

    // Use refs instead of state to avoid stale closures in async callbacks
    const hasNotifiedWebRef = useRef(false);
    const hasNotifiedWindowRef = useRef(false); // [NEW] Only one Windows notification per session
    const isNotifyingWindowRef = useRef(false); // Lock to prevent race conditions

    const dropdownRef = useRef<HTMLDivElement>(null);
    const activeNotificationRef = useRef<Notification | null>(null); // [NEW] Track active notification
    const router = useRouter();

    useEffect(() => {
        // Load notifications on initial mount
        loadNotifications('FORCE');

        // Poll every 60 seconds (Silent update)
        const interval = setInterval(() => loadNotifications('SILENT'), 60000);

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        // Listen for Dashboard Refresh (Socket updates -> Silent)
        const handleDashboardRefresh = () => loadNotifications('SILENT');
        window.addEventListener('refreshNotifications', handleDashboardRefresh);

        // Listen for Window Focus (User returns -> Check)
        const handleFocus = () => loadNotifications('CHECK');
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('refreshNotifications', handleDashboardRefresh);
            window.removeEventListener('focus', handleFocus);
            clearInterval(interval);
        };
    }, []);

    const loadNotifications = async (mode: 'FORCE' | 'CHECK' | 'SILENT' = 'CHECK') => {
        const items = await fetchNotifications();

        // 1. Apply DASHBOARD FILTERS (Area, Type, Name)
        // This affects BOTH the List (UI) and the Alerts (Popups)
        const dashboardFilters = JSON.parse(localStorage.getItem('dashboardFilters') || '{}');
        const applyDashboardFilters = (list: NotificationItem[]) => {
            return list.filter(item => {
                if (dashboardFilters.area && !item.area?.toLowerCase().includes(dashboardFilters.area.toLowerCase())) return false;
                if (dashboardFilters.type && !item.machineType?.toLowerCase().includes(dashboardFilters.type.toLowerCase())) return false;
                if (dashboardFilters.name && !item.machineName?.toLowerCase().includes(dashboardFilters.name.toLowerCase())) return false;
                if (dashboardFilters.pmType && !item.preventiveType?.toLowerCase().includes(dashboardFilters.pmType.toLowerCase())) return false;
                return true;
            });
        };

        const displayItems = applyDashboardFilters(items);
        setNotifications(displayItems);

        // 2. Filter logic for ALERTS (Muted Machines via Preferences)
        const savedPrefs = localStorage.getItem('notification_prefs_v2');
        let prefFilteredItems = items;
        let prefWindowsFilteredItems = items;

        if (savedPrefs) {
            const prefs = JSON.parse(savedPrefs) as { [key: number]: { web: boolean, windows: boolean } };
            // Default is TRUE if pref is missing
            prefFilteredItems = items.filter(item => {
                const pref = prefs[item.machineId];
                return !pref || pref.web !== false;
            });

            prefWindowsFilteredItems = items.filter(item => {
                const id = item.machineId;
                const pref = prefs[id];
                return !pref || pref.windows !== false;
            });
        }

        const activeWebItems = applyDashboardFilters(prefFilteredItems);
        const activeWinItems = applyDashboardFilters(prefWindowsFilteredItems);

        // Calculate counts based on ACTIVE context
        const webOverdueCount = activeWebItems.filter(i => i.type === 'overdue').length;
        const webUpcomingCount = activeWebItems.filter(i => i.type === 'upcoming').length;
        const winOverdueCount = activeWinItems.filter(i => i.type === 'overdue').length;
        const winUpcomingCount = activeWinItems.filter(i => i.type === 'upcoming').length;

        // Logic to trigger notifications
        if (webOverdueCount > 0 || webUpcomingCount > 0 || winOverdueCount > 0 || winUpcomingCount > 0) {
            console.log("Notification Check:", { webOverdueCount, webUpcomingCount, winOverdueCount, winUpcomingCount, mode });
        }

        // 1. Windows Alert (System Notification)
        // Only ONE notification per page session
        // Uses localStorage cooldown to control notifications across sessions
        if (mode !== 'SILENT' && !hasNotifiedWindowRef.current && (winOverdueCount > 0 || winUpcomingCount > 0)) {
            // Check cooldown (15 minutes) - applies even on page refresh
            const lastWinNotificationTime = parseInt(localStorage.getItem('lastWinNotificationTime') || '0');
            const now = Date.now();
            const timeDiff = now - lastWinNotificationTime;
            const isCooldownOver = timeDiff >= 9;//900000; // 15 minutes (no FORCE bypass)

            if (isCooldownOver) {
                // Mark as notified for this session
                hasNotifiedWindowRef.current = true;

                try {
                    const granted = await requestNotificationPermission();
                    if (granted) {
                        if (winOverdueCount > 0) {
                            const audio = new Audio('/beep_short.ogg');
                            audio.play().catch(e => console.log("Audio play failed", e));
                        }

                        // Create notification (no onClose that resets flag)
                        const n = showSystemNotification(
                            'Machine Maintenance Alert',
                            `Filtered View: ${winOverdueCount} overdue, ${winUpcomingCount} upcoming.`
                        );

                        if (n) {
                            activeNotificationRef.current = n;
                            console.log("Windows Notification created.");
                        } else {
                            // Failed to create, allow retry
                            hasNotifiedWindowRef.current = false;
                        }

                        // Update cooldown timestamp
                        localStorage.setItem('lastWinNotificationTime', now.toString());
                    } else {
                        // Permission denied, allow retry
                        hasNotifiedWindowRef.current = false;
                    }
                } catch (e) {
                    console.error("Notification error:", e);
                    hasNotifiedWindowRef.current = false;
                }
            }
        }

        // 2. Web Alert (Swal Toast) - Only on FORCE or CHECK (User interaction)
        // Or should Web Alert also be SILENT on background updates? 
        // User only complained about Windows Notification. Let's keep Web Alert consistent with Windows for now.
        if (mode !== 'SILENT' && !hasNotifiedWebRef.current && (webOverdueCount > 0 || webUpcomingCount > 0)) {
            // Determine icon and color based on severity
            const icon = webOverdueCount > 0 ? 'error' : 'warning';
            const title = webOverdueCount > 0 ? 'Attention Needed!' : 'Upcoming Maintenance';

            const message = [];
            if (webOverdueCount > 0) message.push(`${webOverdueCount} Overdue`);
            if (webUpcomingCount > 0) message.push(`${webUpcomingCount} Upcoming`);

            const Toast = Swal.mixin({
                toast: true,
                position: 'top-start',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });

            Toast.fire({
                icon: icon,
                title: title,
                text: `Machines matching filter: ${message.join(', ')}`
            });

            hasNotifiedWebRef.current = true;
        }
    };

    const handleItemClick = (item: NotificationItem) => {
        setIsOpen(false);
        // setShowToast(false); // REMOVED
        if (item.machineId) {
            router.push(`/pm/inspect/${item.machineId}`);
        }
    };

    const toggleDropdown = () => setIsOpen(!isOpen);

    const overdueCount = notifications.filter(n => n.type === 'overdue').length;
    // const upcomingCount = notifications.filter(n => n.type === 'upcoming').length; // Unused variable
    const totalCount = notifications.length;

    const renderNotificationContent = () => (
        <div className="list-group list-group-flush" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted">
                    <i className="bi bi-bell-slash fs-4 d-block mb-2"></i>
                    No new notifications
                </div>
            ) : (
                <>
                    {/* Overdue Section */}
                    {notifications.filter(n => n.type === 'overdue').length > 0 && (
                        <div className="mb-2">
                            <div className="px-3 py-2 fw-bold text-danger d-flex align-items-center" style={{ backgroundColor: '#fde8e8' }}>
                                <i className="bi bi-exclamation-triangle-fill me-2"></i> Overdue
                            </div>
                            {notifications.filter(n => n.type === 'overdue').map((item, index) => (
                                <div
                                    key={`overdue-${index}`}
                                    className="list-group-item list-group-item-action px-3 py-3 border-start-0 border-end-0"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleItemClick(item)}
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="mb-1 fw-bold text-dark">{item.machineName}</h6>
                                            <small className="text-muted d-block">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                                            <small className="text-secondary" style={{ fontSize: '0.75em' }}>{item.area} - {item.machineType}</small>
                                        </div>
                                        <span className="badge bg-danger rounded-1 px-2 py-1">CRITICAL</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upcoming Section */}
                    {notifications.filter(n => n.type === 'upcoming').length > 0 && (
                        <div>
                            <div className="px-3 py-2 fw-bold text-warning d-flex align-items-center" style={{ backgroundColor: '#fff8e1', color: '#b45309' }}>
                                <i className="bi bi-cone-striped me-2"></i> Upcoming
                            </div>
                            {notifications.filter(n => n.type === 'upcoming').map((item, index) => (
                                <div
                                    key={`upcoming-${index}`}
                                    className="list-group-item list-group-item-action px-3 py-3 border-start-0 border-end-0"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleItemClick(item)}
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="mb-1 fw-bold text-dark">{item.machineName}</h6>
                                            <small className="text-muted d-block">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                                            <small className="text-secondary" style={{ fontSize: '0.75em' }}>{item.area} - {item.machineType}</small>
                                        </div>
                                        <span className="badge bg-warning text-dark rounded-1 px-2 py-1">SCHEDULED</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );

    return (
        <>
            {/* Navbar Bell Icon */}
            <div className="position-relative" ref={dropdownRef}>
                <button
                    className="btn btn-light position-relative rounded-circle shadow-sm border"
                    onClick={toggleDropdown}
                    style={{ width: '40px', height: '40px', padding: 0 }}
                >
                    <i className="bi bi-bell-fill text-secondary"></i>
                    {totalCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light">
                            {totalCount}
                            <span className="visually-hidden">unread messages</span>
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div className="card position-absolute end-0 mt-2 shadow-lg border-0" style={{ width: '400px', zIndex: 1050 }}>
                        <div className="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center border-bottom-0">
                            <span className="fs-5">Machine Maintenance Alerts</span>
                            <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsOpen(false)}></button>
                        </div>
                        {renderNotificationContent()}
                    </div>
                )}
            </div>
            {/* Custom Toast Removed */}
        </>
    );
}
