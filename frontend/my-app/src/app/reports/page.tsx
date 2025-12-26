"use client";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import config from "../config";
import { useSearchParams } from "next/navigation";
import Swal from 'sweetalert2';
import Pagination from "../components/Pagination";
import { useAuth } from "../../context/AuthContext";

interface PMRecord {
    id: number;
    date: string;
    status: string;
    inspector: string;
    checker: string;
    remark: string;
    machine: {
        id: number;
        code: string;
        name: string;
    };
    details: any[];
}

function ReportsContent() {
    const searchParams = useSearchParams();
    const [records, setRecords] = useState<PMRecord[]>([]);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        machineId: "",
        status: "",
        areaId: "",
        machineTypeId: ""
    });
    const [machines, setMachines] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [machineTypes, setMachineTypes] = useState<any[]>([]);

    const { isAuthenticated, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading || !isAuthenticated) return;

        // Set default date range to last 1 year
        const end = new Date();
        const start = new Date();
        start.setFullYear(end.getFullYear() - 1);

        setFilters(prev => ({
            ...prev,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        }));

        fetchMachines();
        fetchDropdownData();
        const machineIdParam = searchParams.get("machineId");
        if (machineIdParam) {
            setFilters(prev => ({ ...prev, machineId: machineIdParam }));
        }
    }, [searchParams, authLoading, isAuthenticated]);

    useEffect(() => {
        if (filters.startDate && filters.endDate) {
            fetchReports();
        }
    }, [filters]);

    const fetchMachines = () => {
        axios.get(`${config.apiServer}/api/machines`)
            .then(res => setMachines(res.data))
            .catch(err => console.error(err));
    };

    const fetchDropdownData = () => {
        axios.get(`${config.apiServer}/api/areas`).then(res => setAreas(res.data)).catch(console.error);
        axios.get(`${config.apiServer}/api/machine-types`).then(res => setMachineTypes(res.data)).catch(console.error);
    };

    const fetchReports = () => {
        const params = new URLSearchParams();
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
        if (filters.machineId) params.append("machineId", filters.machineId);
        if (filters.status) params.append("status", filters.status);

        axios.get(`${config.apiServer}/api/reports?${params.toString()}`)
            .then(res => {
                let data = res.data;
                // Client-side filtering for Area/Type if machineId is not selected
                if (!filters.machineId) {
                    if (filters.areaId) {
                        data = data.filter((r: any) => r.machine?.machineMaster?.machineType?.area?.id === parseInt(filters.areaId));
                    }
                    if (filters.machineTypeId) {
                        data = data.filter((r: any) => r.machine?.machineMaster?.machineType?.id === parseInt(filters.machineTypeId));
                    }
                }
                setRecords(data);
            })
            .catch(err => console.error(err));
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        // Simple CSV export
        const headers = ["Date", "Machine Code", "Machine Name", "Inspector", "Checker", "Status", "Remark"];
        const csvContent = [
            headers.join(","),
            ...records.map(r => [
                new Date(r.date).toLocaleDateString(),
                r.machine?.code,
                `"${r.machine?.name}"`,
                r.inspector,
                r.checker,
                r.status,
                `"${r.remark || ""}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `pm_report_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`${config.apiServer}/api/pm/records/${id}`)
                    .then(() => {
                        fetchReports();
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Record has been deleted.',
                            icon: 'success',
                            timer: 300,
                            showConfirmButton: false
                        });
                    })
                    .catch(err => {
                        console.error(err);
                        Swal.fire('Error!', 'Failed to delete record.', 'error');
                    });
            }
        });
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = records.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 no-print">
                <div>
                    <h2 className="fw-bold text-dark mb-1">PM Reports</h2>
                    <p className="text-muted mb-0">View and export maintenance history</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-success shadow-sm" onClick={handleExportExcel}>
                        <i className="bi bi-file-earmark-excel me-2"></i>Export Excel
                    </button>
                    <button className="btn btn-secondary shadow-sm" onClick={handlePrint}>
                        <i className="bi bi-printer me-2"></i>Print Report
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm rounded-3 mb-4 no-print">
                <div className="card-body p-4">
                    <div className="row g-3">
                        <div className="col-md-2">
                            <label className="form-label fw-bold small text-muted">Start Date</label>
                            <input type="date" className="form-control" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold small text-muted">End Date</label>
                            <input type="date" className="form-control" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold small text-muted">Area</label>
                            <select className="form-select" name="areaId" value={filters.areaId} onChange={handleFilterChange}>
                                <option value="">All Areas</option>
                                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold small text-muted">Machine Type</label>
                            <select className="form-select" name="machineTypeId" value={filters.machineTypeId} onChange={handleFilterChange}>
                                <option value="">All Types</option>
                                {machineTypes.filter(t => !filters.areaId || t.areaId === parseInt(filters.areaId)).map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold small text-muted">Machine</label>
                            <select className="form-select" name="machineId" value={filters.machineId} onChange={handleFilterChange}>
                                <option value="">All Machines</option>
                                {machines.filter(m => {
                                    const mAreaId = m.machineMaster?.machineType?.area?.id;
                                    const mTypeId = m.machineMaster?.machineType?.id;
                                    const areaMatch = !filters.areaId || mAreaId === parseInt(filters.areaId);
                                    const typeMatch = !filters.machineTypeId || mTypeId === parseInt(filters.machineTypeId);
                                    return areaMatch && typeMatch;
                                }).map(m => (
                                    <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold small text-muted">Status</label>
                            <select className="form-select" name="status" value={filters.status} onChange={handleFilterChange}>
                                <option value="">All Status</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="LATE">Late</option>
                                <option value="PLANNED">Planned</option>
                            </select>
                        </div>
                        <div className="col-12 text-end mt-3">
                            <button className="btn btn-primary px-4 shadow-sm" onClick={fetchReports}>
                                <i className="bi bi-funnel me-2"></i>Filter Reports
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Table */}
            <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-secondary">
                                <tr>
                                    <th className="py-3 ps-4">Date</th>
                                    <th className="py-3">Machine</th>
                                    <th className="py-3">Inspector</th>
                                    <th className="py-3">Checker</th>
                                    <th className="py-3 text-center">Status</th>
                                    <th className="py-3">Remark</th>
                                    <th className="py-3 text-center pe-4 no-print">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map(r => (
                                    <tr key={r.id}>
                                        <td className="ps-4 text-muted">{new Date(r.date).toLocaleDateString()}</td>
                                        <td>
                                            <div className="fw-bold">{r.machine?.name}</div>
                                            <small className="text-muted font-monospace">{r.machine?.code}</small>
                                        </td>
                                        <td>{r.inspector}</td>
                                        <td>{r.checker}</td>
                                        <td className="text-center">
                                            <span className={`badge rounded-pill fw-normal px-3 py-2 ${r.status === 'COMPLETED' ? 'bg-success bg-opacity-10 text-success border border-success' :
                                                r.status === 'LATE' ? 'bg-danger bg-opacity-10 text-danger border border-danger' :
                                                    'bg-warning bg-opacity-10 text-warning border border-warning'
                                                }`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="text-muted small">{r.remark}</td>
                                        <td className="text-center pe-4 no-print">
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {records.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-5 text-muted">No records found matching your filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="mt-4 no-print">
                <Pagination
                    totalItems={records.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .card { border: none !important; box-shadow: none !important; }
                    .container-fluid { background: white !important; }
                    body { background: white !important; }
                }
            `}</style>
        </div>
    );
}

export default function Reports() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>}>
            <ReportsContent />
        </Suspense>
    );
}
