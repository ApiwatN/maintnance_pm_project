"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import config from "../../config";
import axios from "axios";
import { useRouter } from "next/navigation";

import { useAuth } from "../../../context/AuthContext";
import { useSocket } from "../../components/SocketProvider";
import RescheduleModal from "../../components/RescheduleModal";
import ActionPopover from "../../components/ActionPopover";

interface MachineStatus {
    id: number;
    name: string;
    code: string;
    location: string;
    area: string;
    areaId: number;
    type: string;
    preventiveType: string;
    status: 'NORMAL' | 'UPCOMING' | 'OVERDUE' | 'NO_SCHEDULE';
    lastCheckStatus?: 'HAS_NG' | 'ALL_OK' | null;
    nextPMDate: string;
    lastPMDate: string | null;
    daysUntil: number;
    frequencyDays: number;
    allPlans?: {
        preventiveTypeId: number;
        preventiveTypeName: string;
        status: 'NORMAL' | 'UPCOMING' | 'OVERDUE' | 'NO_SCHEDULE';
        daysUntil: number | null;
        nextPMDate: string | null;
        isCritical: boolean;
    }[];
}

export default function OverallMachinePage() {
    const { token, loading: authLoading, user } = useAuth();
    const { socket } = useSocket();
    const router = useRouter();
    const [machines, setMachines] = useState<MachineStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [areaFilter, setAreaFilter] = useState<string>("");

    // Permission-based states
    const [rescheduleModal, setRescheduleModal] = useState<{
        show: boolean;
        machineId: number;
        machineName: string;
        allPlans?: MachineStatus['allPlans'];
    }>({ show: false, machineId: 0, machineName: '' });

    const [popover, setPopover] = useState<{
        show: boolean;
        anchorRect: { top: number; left: number; width: number; height: number } | null;
        machine: MachineStatus | null;
    }>({ show: false, anchorRect: null, machine: null });

    const getUserPermission = () => {
        if (!user) return 'PM_ONLY';
        if (user.systemRole === 'ADMIN') return 'PM_AND_RESCHEDULE';
        return user.permissionType || 'PM_ONLY';
    };

    const handleMachineClick = (machine: MachineStatus, e: React.MouseEvent) => {
        e.preventDefault();
        const permission = getUserPermission();

        // If NORMAL status, go to history
        if (machine.status === 'NORMAL') {
            // [FIX] Pass typeId of the first plan for correct PM Type filter
            const firstPlan = machine.allPlans?.[0];
            const typeIdParam = firstPlan ? `&typeId=${firstPlan.preventiveTypeId}` : '';
            router.push(`/pm/history/${machine.id}?returnTo=/machines/overall${typeIdParam}`);
            return;
        }

        // Get the most critical plan
        const criticalPlan = machine.allPlans?.find(p => p.status === 'OVERDUE' || p.status === 'UPCOMING') || machine.allPlans?.[0];

        if (permission === 'PM_ONLY') {
            router.push(`/pm/inspect/${machine.id}?returnTo=/machines/overall`);
        } else if (permission === 'RESCHEDULE_ONLY') {
            setRescheduleModal({
                show: true,
                machineId: machine.id,
                machineName: machine.name,
                allPlans: machine.allPlans
            });
        } else {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setPopover({
                show: true,
                anchorRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
                machine
            });
        }
    };

    const handlePopoverInspect = () => {
        if (!popover.machine) return;
        router.push(`/pm/inspect/${popover.machine.id}?returnTo=/machines/overall`);
    };

    const handlePopoverReschedule = () => {
        if (!popover.machine) return;
        setRescheduleModal({
            show: true,
            machineId: popover.machine.id,
            machineName: popover.machine.name,
            allPlans: popover.machine.allPlans
        });
    };

    const fetchStatus = () => {
        if (!token) return;

        if (machines.length === 0) {
            setLoading(true);
        } else {
            setIsRefreshing(true);
        }

        axios.get(`${config.apiServer}/api/pm/global-status`)
            .then((res) => {
                setMachines(res.data);
            })
            .catch((err) => {
                console.error("Failed to fetch machine status", err);
            })
            .finally(() => {
                setLoading(false);
                setIsRefreshing(false);
            });
    };

    useEffect(() => {
        if (!authLoading && token) {
            fetchStatus();
        }
        const savedArea = localStorage.getItem("overall_area_filter");
        if (savedArea) {
            setAreaFilter(savedArea);
        }
    }, [authLoading, token]);

    // Socket Listener
    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            console.log("Real-time Update: Overall Status");
            fetchStatus();
        };

        socket.on('pm_update', handleUpdate);
        socket.on('machine_update', handleUpdate);

        return () => {
            socket.off('pm_update');
            socket.off('machine_update');
        };
    }, [socket, token]); // Re-bind if token changes (though fetchStatus uses closure or ref? actually fetchStatus uses token from scope? No, it uses token from useAuth hook which is stable? Wait, fetchStatus uses token from scope, but token is in dependency of first useEffect. fetchStatus definition captures scope. Better to just call fetchStatus.)

    // Initialize Bootstrap tooltips
    useEffect(() => {
        if (typeof window !== 'undefined' && machines.length > 0) {
            // Add custom CSS for wider tooltips
            const style = document.createElement('style');
            style.id = 'custom-tooltip-style';
            style.textContent = `
                .tooltip-inner {
                    max-width: 500px !important;
                    text-align: left !important;
                }
            `;
            document.head.appendChild(style);

            // Dynamically import Bootstrap
            // @ts-expect-error - Bootstrap types not available but works at runtime
            import('bootstrap').then((bootstrap) => {
                const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
                const tooltipList = Array.from(tooltipTriggerList).map(tooltipTriggerEl =>
                    new bootstrap.Tooltip(tooltipTriggerEl)
                );

                // Cleanup tooltips on unmount or re-render
                return () => {
                    tooltipList.forEach(tooltip => tooltip.dispose());
                    // Remove custom style
                    const styleEl = document.getElementById('custom-tooltip-style');
                    if (styleEl) styleEl.remove();
                };
            });
        }
    }, [machines]);

    useEffect(() => {
        if (machines.length > 0 || areaFilter) {
            localStorage.setItem("overall_area_filter", areaFilter);
        }
    }, [areaFilter, machines]);

    // Extract unique Areas for filter
    const areas = useMemo(() => {
        const uniqueAreas = Array.from(new Set(machines.map(m => m.area)));
        return uniqueAreas.sort();
    }, [machines]);

    // Group machines by Area -> Type
    const groupedMachines = useMemo(() => {
        const filtered = areaFilter ? machines.filter(m => m.area === areaFilter) : machines;
        const groups: { [area: string]: { [type: string]: MachineStatus[] } } = {};

        filtered.forEach(m => {
            if (!groups[m.area]) groups[m.area] = {};
            if (!groups[m.area][m.type]) groups[m.area][m.type] = [];
            groups[m.area][m.type].push(m);
        });

        return groups;
    }, [machines, areaFilter]);

    // Calculate Summary Stats
    const stats = useMemo(() => {
        const filtered = areaFilter ? machines.filter(m => m.area === areaFilter) : machines;
        return {
            total: filtered.length,
            overdue: filtered.filter(m => m.status === 'OVERDUE').length,
            upcoming: filtered.filter(m => m.status === 'UPCOMING').length,
            // Split normal into Completed (ALL_OK or no record) and Checked(NG) (HAS_NG)
            completed: filtered.filter(m => m.status === 'NORMAL' && m.lastCheckStatus !== 'HAS_NG').length,
            hasNG: filtered.filter(m => m.lastCheckStatus === 'HAS_NG').length
        };
    }, [machines, areaFilter]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OVERDUE': return 'danger';
            case 'UPCOMING': return 'warning';
            case 'NORMAL': return 'success';
            default: return 'secondary';
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    return (
        <div className="container-fluid py-4 px-4 bg-light min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Overall Machine Status</h2>
                    <p className="text-muted mb-0">Overview of machine statuses by Area & Type</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-light border shadow-sm" onClick={fetchStatus} disabled={isRefreshing}>
                        <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin-animation' : ''}`}></i> {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Filter and Summary */}
            <div className="row g-3 mb-4">
                <div className="col-md-2">
                    <label className="form-label fw-bold small text-muted">Filter by Area</label>
                    <select
                        className="form-select border-0 shadow-sm"
                        value={areaFilter}
                        onChange={(e) => setAreaFilter(e.target.value)}
                    >
                        <option value="">All Areas</option>
                        {areas.map(area => <option key={area} value={area}>{area}</option>)}
                    </select>
                </div>
                <div className="col-md-10 ms-auto">
                    <div className="row g-3 justify-content-end">
                        <div className="col-md-2">
                            <div className="card border-0 shadow-sm bg-primary text-white h-100">
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="mb-0 text-white-50">Total Machines</h6>
                                        <h3 className="mb-0 fw-bold">{stats.total}</h3>
                                    </div>
                                    <i className="bi bi-activity fs-1 opacity-25"></i>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-2">
                            <div className="card border-0 shadow-sm bg-danger text-white h-100">
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="mb-0 text-white-50">Overdue</h6>
                                        <h3 className="mb-0 fw-bold">{stats.overdue}</h3>
                                    </div>
                                    <i className="bi bi-exclamation-triangle-fill fs-1 opacity-25"></i>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-2">
                            <div className="card border-0 shadow-sm bg-warning text-dark h-100">
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="mb-0 text-black-50">Upcoming</h6>
                                        <h3 className="mb-0 fw-bold">{stats.upcoming}</h3>
                                    </div>
                                    <i className="bi bi-clock-history fs-1 opacity-25"></i>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-2">
                            <div className="card border-0 shadow-sm bg-success text-white h-100">
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="mb-0 text-white-50">Completed</h6>
                                        <h3 className="mb-0 fw-bold">{stats.completed}</h3>
                                    </div>
                                    <i className="bi bi-check-circle-fill fs-1 opacity-25"></i>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-2">
                            <div className="card border-0 shadow-sm bg-danger text-white h-100">
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="mb-0 text-white-50">Checked (NG)</h6>
                                        <h3 className="mb-0 fw-bold">{stats.hasNG}</h3>
                                    </div>
                                    <i className="bi bi-x-circle-fill fs-1 opacity-25"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Groups */}
            {Object.keys(groupedMachines).sort().map(area => {
                const areaPool = groupedMachines[area];
                const machineTypes = Object.keys(areaPool).sort();

                return (
                    <div key={area} className="card border-0 shadow-sm mb-4">
                        {/* Area Header */}
                        <div className="card-header bg-white py-2 px-3">
                            <h5 className="mb-0 text-primary fw-bold" style={{ fontSize: '1.1rem' }}>
                                <i className="bi bi-geo-alt-fill me-2"></i>{area}
                            </h5>
                        </div>
                        <div className="card-body bg-light">
                            {machineTypes.map(type => {
                                const typeMachines = areaPool[type];
                                return (
                                    <div key={type} className="mb-0 last:mb-0">
                                        <h6 className="fw-bold text-secondary mb-2 ms-1 border-start border-3 border-primary ps-2">
                                            {type} <span className="badge bg-secondary opacity-50 rounded-pill ms-2">{typeMachines.length}</span>
                                        </h6>
                                        <div className="row g-2">
                                            {/* ULTRA COMPACT CARDS - INCREASED SIZE AS REQUESTED */}
                                            {typeMachines.map(machine => {
                                                const hasNG = machine.lastCheckStatus === 'HAS_NG';
                                                const allOK = machine.lastCheckStatus === 'ALL_OK';

                                                // Priority: HAS_NG > OVERDUE > ALL_OK > UPCOMING > NORMAL
                                                let displayStatus: string = machine.status;
                                                let color = getStatusColor(machine.status);
                                                let bgColor = '#ffffff';

                                                if (hasNG) {
                                                    displayStatus = 'CHECKED(NG)';
                                                    color = 'danger';
                                                    bgColor = '#ffebee';
                                                } else if (machine.status === 'OVERDUE') {
                                                    bgColor = '#ffebee';
                                                } else if (allOK) {
                                                    // Only show Checked OK if not upcoming warning? 
                                                    // User wants "Checked(ALL OK)" if Checked. But if UPCOMING?
                                                    // Priority: NG > OVERDUE > UPCOMING > NORMAL
                                                    // Where does OK sit? 
                                                    // If OK but UPCOMING -> Show UPCOMING? Or OK?
                                                    // User said: "If checked OK... show Checked(ALL OK)".
                                                    // Assuming Checked Status is more informative about health.
                                                    // But UPCOMING is about Schedule.
                                                    // Let's mix:
                                                    // If Status is Normal -> Show ALL OK.
                                                    // If Status is UPCOMING -> Show UPCOMING.
                                                    if (machine.status === 'NORMAL') {
                                                        displayStatus = 'CHECKED(OK)';
                                                        // Keep green
                                                        bgColor = '#e8f5e9';
                                                    }
                                                } else {
                                                    switch (machine.status) {
                                                        case 'UPCOMING': bgColor = '#fff8e1'; break;
                                                        case 'NORMAL': bgColor = '#e8f5e9'; break;
                                                        default: bgColor = '#f8f9fa';
                                                    }
                                                }

                                                // Build tooltip content with PM details - prevent wrapping
                                                const tooltipContent = machine.allPlans?.map(plan => {
                                                    let statusText = '';
                                                    if (plan.status === 'OVERDUE') {
                                                        statusText = `⚠️ เกินกำหนดแล้ว ${Math.abs(plan.daysUntil || 0)} วัน`;
                                                    } else if (plan.status === 'UPCOMING') {
                                                        statusText = `🔔 ใกล้ถึงกำหนดในอีก ${plan.daysUntil || 0} วัน`;
                                                    } else {
                                                        statusText = `✅ PM เรียบร้อยแล้ว`;
                                                    }
                                                    // Wrap each line in div with nowrap to prevent breaking
                                                    return `<div style="white-space: nowrap;"><strong>${plan.preventiveTypeName}:</strong> ${statusText}</div>`;
                                                }).join('') || 'ไม่มีข้อมูล PM';

                                                return (
                                                    <div key={machine.id} className="col-6 col-sm-1 col-md-1 col-lg-1">
                                                        <div
                                                            onClick={(e) => handleMachineClick(machine, e)}
                                                            className="text-decoration-none"
                                                            style={{ cursor: 'pointer' }}
                                                            data-bs-toggle="tooltip"
                                                            data-bs-html="true"
                                                            data-bs-placement="top"
                                                            title={tooltipContent}
                                                        >
                                                            <div className={`card h-auto border-${color} shadow-sm position-relative hover-shadow transition-all`} style={{ transition: 'transform 0.2s', cursor: 'pointer' }}>
                                                                <div className={`card-header bg-${color} text-white py-0 px-1 d-flex justify-content-between align-items-center`} style={{ minHeight: '22px' }}>
                                                                    <span className="fw-bold text-truncate" style={{ fontSize: '0.6rem' }} title={displayStatus}>{displayStatus}</span>
                                                                    {machine.daysUntil !== null && (
                                                                        <span className="badge bg-white text-dark rounded-pill fw-bold border border-secondary" style={{ fontSize: '0.65em', padding: '0.1em 0.4em' }}>
                                                                            {machine.daysUntil < 0 ? `${Math.abs(machine.daysUntil)}d` : `${machine.daysUntil}d`}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className={`card-body p-1 text-center d-flex flex-column`} style={{ backgroundColor: bgColor }}>
                                                                    <div className="mb-1 mt-1">
                                                                        <h6 className="fw-bold mb-0 text-dark text-truncate" style={{ fontSize: '0.85rem' }} title={machine.name}>{machine.name}</h6>
                                                                    </div>

                                                                    <div className="text-start border-top border-secondary border-opacity-25 pt-1 mt-0" style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>
                                                                        {machine.allPlans && machine.allPlans.length > 0 ? (
                                                                            machine.allPlans.map(plan => {
                                                                                const isCritical = plan.isCritical && (plan.status === 'OVERDUE' || plan.status === 'UPCOMING');
                                                                                const textClass = isCritical
                                                                                    ? (plan.status === 'OVERDUE' ? 'text-danger fw-bold' : 'text-dark fw-bold')
                                                                                    : 'text-secondary';

                                                                                return (
                                                                                    <div key={plan.preventiveTypeId} className="d-flex justify-content-between align-items-center text-nowrap" style={{ overflow: 'hidden' }}>
                                                                                        <span className={`${textClass} text-truncate`} title={plan.preventiveTypeName}>
                                                                                            {plan.preventiveTypeName}:
                                                                                        </span>
                                                                                        <span className={`fw-bold ${textClass} ms-1`} style={{ flexShrink: 0 }}>
                                                                                            {plan.nextPMDate ? new Date(plan.nextPMDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : '-'}
                                                                                        </span>
                                                                                    </div>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <div className="text-center text-muted">-</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {machines.length === 0 && !loading && (
                <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                    No machines found.
                </div>
            )}

            {/* Reschedule Modal */}
            <RescheduleModal
                show={rescheduleModal.show}
                onClose={() => setRescheduleModal({ ...rescheduleModal, show: false })}
                machineId={rescheduleModal.machineId}
                machineName={rescheduleModal.machineName}
                allPlans={rescheduleModal.allPlans}
                onSuccess={fetchStatus}
            />

            {/* Action Popover */}
            <ActionPopover
                show={popover.show}
                anchorRect={popover.anchorRect}
                onClose={() => setPopover({ show: false, anchorRect: null, machine: null })}
                onInspect={handlePopoverInspect}
                onReschedule={handlePopoverReschedule}
            />
        </div>
    );
}
