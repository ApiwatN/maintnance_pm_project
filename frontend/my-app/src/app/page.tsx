"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import config from "./config";
import Pagination from "./components/Pagination";
import NotificationCenter from "./components/NotificationCenter";
import { useSocket } from "./components/SocketProvider";
import { useAuth } from "../context/AuthContext";
import RescheduleModal from "./components/RescheduleModal";
import ActionPopover from "./components/ActionPopover";
import { useRouter } from "next/navigation";

interface Machine {
  id: number;
  code: string;
  name: string;
  model: string;
  location: string;
  status: string;
  lastCheckStatus?: "HAS_NG" | "ALL_OK";
  machineMaster?: {
    name: string;
    machineType?: {
      name: string;
      area?: {
        name: string;
      }
    }
  };
  // These are polyfilled by the backend from the "most urgent" PM plan
  preventiveType?: {
    id?: number;
    name: string;
  };
  pmConfig?: {
    nextPMDate: string;
    lastPMDate: string;
    frequencyDays?: number;
    advanceNotifyDays?: number;
  };
  activePlanType?: string; // Name of the PM Type driving the current status
  pmPlans?: any[]; // Full list of PM plans (optional, for future use)
  preventiveTypeId?: number; // ID of the PM Type for this row
}

interface DashboardData {
  summary: {
    completed: number;
    upcoming: number;
    overdue: number;
    total: number;
  };
  machines: Machine[];
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { socket } = useSocket();

  // Socket Listener
  useEffect(() => {
    if (!socket) return;
    socket.on('dashboard_update', () => {
      fetchDashboardData();
    });
    return () => {
      socket.off('dashboard_update');
    };
  }, [socket]);

  // Filters for Status Tab
  const [filters, setFilters] = useState({
    area: "",
    type: "",
    name: "",
    pmType: ""
  });

  const [areas, setAreas] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [masters, setMasters] = useState<any[]>([]);
  const [pmTypes, setPmTypes] = useState<any[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();

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
    machine: Machine | null;
  }>({ show: false, anchorRect: null, machine: null });

  const getUserPermission = () => {
    if (!user) return 'PM_ONLY';
    if (user.systemRole === 'ADMIN') return 'PM_AND_RESCHEDULE';
    return user.permissionType || 'PM_ONLY';
  };

  const handleInspectClick = (machine: Machine, e: React.MouseEvent) => {
    const permission = getUserPermission();

    if (permission === 'PM_ONLY') {
      router.push(`/pm/inspect/${machine.id}${machine.preventiveTypeId ? `?typeId=${machine.preventiveTypeId}&returnTo=/` : '?returnTo=/'}`);
    } else if (permission === 'RESCHEDULE_ONLY') {
      setRescheduleModal({
        show: true,
        machineId: machine.id,
        machineName: machine.name,
        preventiveTypeId: machine.preventiveTypeId || 0,
        preventiveTypeName: machine.preventiveType?.name || '-',
        currentDate: machine.pmConfig?.nextPMDate
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
    router.push(`/pm/inspect/${popover.machine.id}${popover.machine.preventiveTypeId ? `?typeId=${popover.machine.preventiveTypeId}&returnTo=/` : '?returnTo=/'}`);
  };

  const handlePopoverReschedule = () => {
    if (!popover.machine) return;
    setRescheduleModal({
      show: true,
      machineId: popover.machine.id,
      machineName: popover.machine.name,
      preventiveTypeId: popover.machine.preventiveTypeId || 0,
      preventiveTypeName: popover.machine.preventiveType?.name || '-',
      currentDate: popover.machine.pmConfig?.nextPMDate
    });
  };

  // Load filters from localStorage
  useEffect(() => {
    if (authLoading) return; // Wait for auth to initialize
    if (!isAuthenticated) return; // Don't fetch if not authenticated

    const savedFilters = localStorage.getItem("dashboardFilters");
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters);
      setFilters(prev => ({ ...prev, ...parsed }));
    }
    setIsLoaded(true);
    fetchDashboardData();
    fetchDropdownData();
  }, [authLoading, isAuthenticated]);

  // Save filters to localStorage
  // Save filters to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("dashboardFilters", JSON.stringify(filters));
    }
  }, [filters, isLoaded]);

  const [timeLeft, setTimeLeft] = useState(300); // 300 seconds = 5 minutes

  // ... (existing code)

  // Reset page when filters change
  useEffect(() => {
    fetchDashboardData();
    setTimeLeft(300);
  }, [filters]);

  // Countdown Timer
  useEffect(() => {
    if (!isLoaded) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchDashboardData();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoaded]);

  // ... (existing code)



  const fetchDashboardData = () => {
    if (authLoading || !isAuthenticated) return;
    if (!data) {
      setLoading(true); // Only show loading spinner on initial load
    } else {
      setIsRefreshing(true);
    }

    axios.get(`${config.apiServer}/api/dashboard/stats`)
      .then((res) => {
        setData(res.data);
        // Trigger Notification Refresh
        window.dispatchEvent(new Event('refreshNotifications'));
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard data", err);
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  const fetchDropdownData = () => {
    axios.get(`${config.apiServer}/api/areas`).then(res => setAreas(res.data)).catch(console.error);
    axios.get(`${config.apiServer}/api/machine-types`).then(res => setTypes(res.data)).catch(console.error);
    axios.get(`${config.apiServer}/api/machine-master`).then(res => setMasters(res.data)).catch(console.error);
    axios.get(`${config.apiServer}/api/preventive-types`).then(res => setPmTypes(res.data)).catch(console.error);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };

      // Reset dependent filters
      if (name === 'area') {
        newFilters.type = "";
        newFilters.name = "";
      } else if (name === 'type') {
        newFilters.name = "";
      }

      return newFilters;
    });
  };

  const filteredMachines = data?.machines.filter(m => {
    const areaName = m.machineMaster?.machineType?.area?.name || "";
    const typeName = m.machineMaster?.machineType?.name || "";
    const machineName = m.name || "";
    const pmTypeName = m.preventiveType?.name || "";

    return (
      (filters.area === "" || areaName.toLowerCase().includes(filters.area.toLowerCase())) &&
      (filters.type === "" || typeName.toLowerCase().includes(filters.type.toLowerCase())) &&
      (filters.name === "" || machineName.toLowerCase().includes(filters.name.toLowerCase())) &&
      (filters.pmType === "" || pmTypeName.toLowerCase().includes(filters.pmType.toLowerCase()))
    );
  }) || [];

  const summaryStats = useMemo(() => {
    // Priority: HAS_NG > OVERDUE > UPCOMING > OK
    // But m.status from backend is calculated based on schedule only.
    // So we must check lastCheckStatus first.

    let has_ng = 0;
    let completed = 0;
    let upcoming = 0;
    let overdue = 0;

    filteredMachines.forEach(m => {
      // Access lastCheckStatus safely (it might be in m or directly on the object depending on interface)
      // The backend sends it as a property of the row object.
      // We need to extend the type definition if needed, or cast to any for now if mapped from backend rows.
      // Based on previous files, 'filteredMachines' are the rows.
      const hasNG = m.lastCheckStatus === 'HAS_NG';

      if (hasNG) {
        has_ng++;
      } else if (m.status === 'OVERDUE') {
        overdue++;
      } else if (m.status === 'UPCOMING') {
        upcoming++;
      } else if (m.status === 'OK') {
        completed++;
      }
    });

    return {
      totalPM: filteredMachines.length,
      uniqueMachines: new Set(filteredMachines.map(m => m.id)).size,
      completed,
      upcoming,
      overdue,
      has_ng
    };
  }, [filteredMachines]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMachines.slice(indexOfFirstItem, indexOfLastItem);

  const availableTypes = useMemo(() => {
    if (!filters.area) return types;
    return types.filter(t => t.area?.name === filters.area);
  }, [filters.area, types]);

  const availableMachines = useMemo(() => {
    let filtered = data?.machines || [];
    if (filters.area) {
      filtered = filtered.filter(m => m.machineMaster?.machineType?.area?.name === filters.area);
    }
    if (filters.type) {
      filtered = filtered.filter(m => m.machineMaster?.machineType?.name === filters.type);
    }
    return filtered;
  }, [filters.area, filters.type, data?.machines]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (!data) return (
    <div className="container mt-5">
      <div className="alert alert-danger shadow-sm border-0 rounded-3">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        Failed to load data. Please ensure the backend server is running.
      </div>
    </div>
  );

  return (
    <>
      <div className="container-fluid py-4 px-4 bg-light min-vh-100">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">Dashboard</h2>
            <p className="text-muted mb-0">Overview of machine status and maintenance activities</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small">
              <i className="bi bi-clock me-1"></i>
              Auto-refresh in: <span className="fw-bold text-primary">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </span>
            <NotificationCenter />
            <button className="btn btn-outline-primary shadow-sm" onClick={() => { fetchDashboardData(); setTimeLeft(300); }} disabled={isRefreshing}>
              <i className={`bi bi-arrow-clockwise me-2 ${isRefreshing ? 'spin-animation' : ''}`}></i> {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>


        {/* Filters Section */}
        <div className="bg-white p-4 rounded-3 mb-4 shadow-sm border">
          <h6 className="fw-bold mb-3 text-secondary border-bottom pb-2"><i className="bi bi-funnel me-2"></i>Filter Dashboard</h6>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-bold small text-muted">Filter by Area</label>
              <select className="form-select border shadow-sm" name="area" value={filters.area} onChange={handleFilterChange}>
                <option value="">All Areas</option>
                {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold small text-muted">Filter by Type</label>
              <select className="form-select border shadow-sm" name="type" value={filters.type} onChange={handleFilterChange} disabled={!filters.area && areas.length > 0}>
                <option value="">All Types</option>
                {availableTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold small text-muted">Filter by Machine</label>
              <select className="form-select border shadow-sm" name="name" value={filters.name} onChange={handleFilterChange} disabled={!filters.type && types.length > 0}>
                <option value="">All Machines</option>
                {Array.from(new Map(availableMachines.map(m => [m.name, m])).values()).map((m, idx) => (
                  <option key={`${m.id}-${idx}`} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold small text-muted">Filter by PM Type</label>
              <select className="form-select border shadow-sm" name="pmType" value={filters.pmType} onChange={handleFilterChange}>
                <option value="">All PM Types</option>
                {pmTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-6 g-4 mb-5">
          <div className="col">
            <div className="card border-0 shadow-sm h-100 overflow-hidden bg-primary bg-opacity-10">
              <div className="card-body position-relative">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>Total Machines</p>
                    <h2 className="fw-bold text-primary mb-0">{summaryStats.uniqueMachines}</h2>
                  </div>
                  <div className="bg-primary text-white p-3 rounded-circle shadow-sm">
                    <i className="bi bi-hdd-stack fs-4"></i>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">
                    <i className="bi bi-check-lg me-1"></i>ใช้งานอยู่
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card border-0 shadow-sm h-100 overflow-hidden bg-info bg-opacity-10">
              <div className="card-body position-relative">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>Total PM</p>
                    <h2 className="fw-bold text-info mb-0">{summaryStats.totalPM}</h2>
                  </div>
                  <div className="bg-info text-dark p-3 rounded-circle shadow-sm">
                    <i className="bi bi-list-check fs-4"></i>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="badge bg-info bg-opacity-10 text-info rounded-pill">
                    <i className="bi bi-clipboard-data me-1"></i>รายการเฝ้าระวัง
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card border-0 shadow-sm h-100 overflow-hidden bg-success bg-opacity-10">
              <div className="card-body position-relative">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>Completed</p>
                    <h2 className="fw-bold text-success mb-0">{summaryStats.completed}</h2>
                  </div>
                  <div className="bg-success text-white p-3 rounded-circle shadow-sm">
                    <i className="bi bi-check-circle fs-4"></i>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-muted small">ดำเนินการเรียบร้อย</span>
                </div>
              </div>
            </div>
          </div>
          {/* CHECKED (NG) CARD - NEW */}
          <div className="col">
            <div className="card border-0 shadow-sm h-100 overflow-hidden bg-danger bg-opacity-10">
              {/* Use a slightly different style or same as Overdue? User wants distinction. 
                 Let's use Danger (Red) for NG as well, as it is critical.
             */}
              <div className="card-body position-relative">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>Checked (NG)</p>
                    <h2 className="fw-bold text-danger mb-0">{summaryStats.has_ng || 0}</h2>
                  </div>
                  <div className="bg-danger text-white p-3 rounded-circle shadow-sm">
                    {/* X Circle for NG */}
                    <i className="bi bi-x-circle-fill fs-4"></i>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill">
                    พบความผิดปกติ
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card border-0 shadow-sm h-100 overflow-hidden bg-warning bg-opacity-10">
              <div className="card-body position-relative">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>Upcoming</p>
                    <h2 className="fw-bold text-warning mb-0">{summaryStats.upcoming}</h2>
                  </div>
                  <div className="bg-warning text-dark p-3 rounded-circle shadow-sm">
                    <i className="bi bi-clock-history fs-4"></i>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-muted small">ถึงกำหนดแจ้งเตือน</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card border-0 shadow-sm h-100 overflow-hidden bg-danger bg-opacity-10">
              <div className="card-body position-relative">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>Overdue</p>
                    <h2 className="fw-bold text-danger mb-0">{summaryStats.overdue}</h2>
                  </div>
                  <div className="bg-danger text-white p-3 rounded-circle shadow-sm">
                    <i className="bi bi-exclamation-triangle fs-4"></i>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill">
                    เกินกำหนดแล้ว
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-primary text-white py-3 px-4">
            <h5 className="mb-0 fw-bold"><i className="bi bi-list-task me-2"></i>Machine Status</h5>
          </div>

          <div className="card-body p-4">


            <div className="table-responsive rounded-3 border">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light text-secondary">
                  <tr>
                    <th className="py-3 ps-4">No</th>
                    <th className="py-3">Machine Name</th>
                    <th className="py-3">Machine Type</th>
                    <th className="py-3">Area</th>
                    <th className="py-3 text-center">PM Type</th>
                    <th className="py-3 text-center">Last PM</th>
                    <th className="py-3 text-center">Next PM</th>
                    <th className="py-3 text-center">Status</th>
                    <th className="py-3 text-center pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((machine, index) => (
                    <tr key={`${machine.id}-${machine.preventiveTypeId || index}`}>
                      <td className="ps-4 text-muted">{indexOfFirstItem + index + 1}</td>
                      <td>
                        <div className="fw-bold text-dark">{machine.name}</div>
                        <small className="text-muted font-monospace" style={{ fontSize: '0.8em' }}>{machine.code}</small>
                      </td>
                      <td>{machine.machineMaster?.machineType?.name || "-"}</td>
                      <td><span className="badge bg-light text-dark border fw-normal">{machine.machineMaster?.machineType?.area?.name || machine.location || "-"}</span></td>
                      <td className="text-center"><span className="badge bg-info text-dark rounded-pill fw-normal px-3">{machine.preventiveType?.name || "-"}</span></td>
                      <td className="text-center text-muted">{machine.pmConfig?.lastPMDate ? new Date(machine.pmConfig.lastPMDate).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}</td>
                      <td className="text-center fw-bold">{machine.pmConfig?.nextPMDate ? new Date(machine.pmConfig.nextPMDate).toLocaleDateString() : '-'}</td>
                      <td className="text-center">
                        <span className={`badge rounded-pill px-3 py-2 fw-normal ${machine.lastCheckStatus === 'HAS_NG' ? 'bg-danger text-white' :
                          machine.status === 'OVERDUE' ? 'bg-danger text-white' :
                            machine.lastCheckStatus === 'ALL_OK' ? 'bg-success text-white' :
                              machine.status === 'UPCOMING' ? 'bg-warning text-dark' :
                                'bg-success text-white'
                          }`}>
                          {machine.lastCheckStatus === 'HAS_NG' ? <><i className="bi bi-x-circle-fill me-1"></i>Checked(HAVE NG)</> :
                            machine.status === 'OVERDUE' ? <><i className="bi bi-exclamation-triangle-fill me-1"></i>Overdue</> :
                              machine.lastCheckStatus === 'ALL_OK' ? <><i className="bi bi-check-circle-fill me-1"></i>Checked(ALL OK)</> :
                                machine.status === 'UPCOMING' ? <><i className="bi bi-clock-fill me-1"></i>Upcoming</> :
                                  <><i className="bi bi-check-circle-fill me-1"></i>Normal</>
                          }
                        </span>
                      </td>
                      <td className="text-center pe-4">
                        <div className="btn-group shadow-sm" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={(e) => handleInspectClick(machine, e)}
                          >
                            <i className="bi bi-clipboard-check"></i> {getUserPermission() === 'RESCHEDULE_ONLY' ? 'เลื่อนวัน' : 'Inspect'}
                          </button>
                          <Link href={`/pm/history/${machine.id}${machine.preventiveTypeId ? `?typeId=${machine.preventiveTypeId}&returnTo=/` : '?returnTo=/'}`} className="btn btn-sm btn-outline-secondary">
                            <i className="bi bi-clock-history"></i> History
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMachines.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                      No machines found matching your filters.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Pagination
                totalItems={filteredMachines.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      <RescheduleModal
        show={rescheduleModal.show}
        onClose={() => setRescheduleModal({ ...rescheduleModal, show: false })}
        machineId={rescheduleModal.machineId}
        machineName={rescheduleModal.machineName}
        preventiveTypeId={rescheduleModal.preventiveTypeId}
        preventiveTypeName={rescheduleModal.preventiveTypeName}
        currentDate={rescheduleModal.currentDate}
        onSuccess={fetchDashboardData}
      />

      {/* Action Popover */}
      <ActionPopover
        show={popover.show}
        anchorRect={popover.anchorRect}
        onClose={() => setPopover({ show: false, anchorRect: null, machine: null })}
        onInspect={handlePopoverInspect}
        onReschedule={handlePopoverReschedule}
      />
    </>
  );
}
