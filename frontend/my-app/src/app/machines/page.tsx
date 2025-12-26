"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import MyModal from "../components/MyModal";
import MachineSettingsNav from "./components/MachineSettingsNav";
import config from "../config";
import axios from "axios";
import Swal from 'sweetalert2';
import Pagination from "../components/Pagination";
import { useSocket } from "../components/SocketProvider";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

interface Machine {
    id: number;
    code: string;
    name: string;
    model: string;
    location: string;
    machineTypeId?: number;
    preventiveType?: {
        id: number;
        name: string;
    };
    machineMaster?: {
        id: number;
        code: string;
        name: string;
        machineType?: {
            id: number;
            name: string;
            area?: {
                id: number;
                name: string;
            }
        }
    };
    pmPlans?: {
        id: number;
        preventiveTypeId: number;
        preventiveType: {
            id: number;
            name: string;
        };
        frequencyDays: number;
        advanceNotifyDays: number;
        nextPMDate?: string;
    }[];
}

export default function MachineSettings() {
    const { socket } = useSocket(); // Socket

    const [machines, setMachines] = useState<Machine[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [machineTypes, setMachineTypes] = useState<any[]>([]);
    const [machineMasters, setMachineMasters] = useState<any[]>([]);
    const [preventiveTypes, setPreventiveTypes] = useState<any[]>([]);

    // UI state for "Edit Mode" -> "Manage Plans"
    const [currentPlans, setCurrentPlans] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        model: "",
        location: "",
        frequencyDays: 30,
        advanceNotifyDays: 7,
        machineTypeId: "",
        machineMasterId: "",
        areaId: "",
        machineTypeMasterId: "",
        nextPMDate: ""
    });

    const [filters, setFilters] = useState({
        area: "",
        type: "",
        name: ""
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // Load filters from localStorage
    useEffect(() => {
        const savedFilters = localStorage.getItem("machines_page_filters");
        if (savedFilters) {
            setFilters(JSON.parse(savedFilters));
        }
        setIsLoaded(true);
    }, []);

    // Save filters to localStorage
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("machines_page_filters", JSON.stringify(filters));
    }, [filters, isLoaded]);

    const [editingId, setEditingId] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const [notificationPrefs, setNotificationPrefs] = useState<{ [key: number]: { web: boolean, windows: boolean } }>({});
    const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);

    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Allow all users to access this page for notification settings
        // if (!loading && user?.systemRole !== 'ADMIN') {
        //     router.push('/');
        // }
    }, [user, loading, router]);

    useEffect(() => {
        // Fetch data for all users so they can see the list
        if (user) {
            fetchMachines();
            fetchAllData();
        }
        // Load notification prefs
        const savedPrefs = localStorage.getItem('notification_prefs_v2');
        if (savedPrefs) {
            setNotificationPrefs(JSON.parse(savedPrefs));
        }
    }, [user]);

    // Socket Listener
    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            fetchMachines();
        };

        socket.on('machine_update', handleUpdate);
        socket.on('pm_update', handleUpdate);

        return () => {
            socket.off('machine_update');
            socket.off('pm_update');
        };
    }, [socket]);

    const toggleNotification = (machineId: number, type: 'web' | 'windows') => {
        setNotificationPrefs(prev => {
            const currentPref = prev[machineId] || { web: true, windows: true };
            const newPref = { ...currentPref, [type]: !currentPref[type] };
            const newPrefs = { ...prev, [machineId]: newPref };

            localStorage.setItem('notification_prefs_v2', JSON.stringify(newPrefs));
            return newPrefs;
        });
    };




    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const fetchAllData = () => {
        axios.get(`${config.apiServer}/api/areas`).then(res => setAreas(res.data)).catch(console.error);
        axios.get(`${config.apiServer}/api/machine-types`).then(res => setMachineTypes(res.data)).catch(console.error);
        axios.get(`${config.apiServer}/api/machine-master`).then(res => setMachineMasters(res.data)).catch(console.error);
        axios.get(`${config.apiServer}/api/preventive-types`).then(res => setPreventiveTypes(res.data)).catch(console.error);
    };

    const fetchMachines = () => {
        axios.get(`${config.apiServer}/api/machines`)
            .then((res) => setMachines(res.data || []))
            .catch((err) => {
                console.error(err);
                setMachines([]);
            });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const availableTypes = useMemo(() => {
        return machineTypes.filter(t => !filters.area || t.area?.name === filters.area);
    }, [machineTypes, filters.area]);

    const availableMachines = useMemo(() => {
        return machineMasters.filter(m =>
            (!filters.area || m.machineType?.area?.name === filters.area) &&
            (!filters.type || m.machineType?.name === filters.type)
        );
    }, [machineMasters, filters.area, filters.type]);

    const filteredMachines = machines.filter(m => {
        const areaName = m.machineMaster?.machineType?.area?.name || "";
        const typeName = m.machineMaster?.machineType?.name || "";
        const machineName = m.name || "";

        return (
            (!filters.area || areaName === filters.area) &&
            (!filters.type || typeName === filters.type) &&
            (!filters.name || machineName === filters.name)
        );
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMachines.slice(indexOfFirstItem, indexOfLastItem);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            if (name === 'area') {
                newFilters.type = "";
                newFilters.name = "";
            } else if (name === 'type') {
                newFilters.name = "";
            }
            return newFilters;
        });
    };

    const filteredMachineTypes = machineTypes.filter(t => !formData.areaId || t.areaId === parseInt(formData.areaId));
    const filteredMachineMasters = machineMasters.filter(m => !formData.machineTypeMasterId || m.machineTypeId === parseInt(formData.machineTypeMasterId));

    // Filter machines for the modal selection (Use MachineMaster to allow creating new ones)
    const filteredMachinesForModal = machineMasters.filter(m => {
        // Filter by Area (via MachineType -> Area)
        const mAreaId = m.machineType?.area?.id;
        if (formData.areaId && mAreaId !== parseInt(formData.areaId)) return false;

        // Filter by Machine Type
        const mTypeId = m.machineTypeId || m.machineType?.id;
        if (formData.machineTypeMasterId && mTypeId !== parseInt(formData.machineTypeMasterId)) return false;

        return true;
    });

    const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const areaId = e.target.value;
        const area = areas.find(a => a.id === parseInt(areaId));
        setFormData({
            ...formData,
            areaId,
            machineTypeMasterId: "",
            machineMasterId: "",
            location: area ? area.name : "",
            name: "",
            model: "",
            code: ""
        });
    };

    const handleMachineTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const typeId = e.target.value;
        setFormData({
            ...formData,
            machineTypeMasterId: typeId,
            machineMasterId: "",
            name: "",
            model: "",
            code: ""
        });
    };

    const handleMasterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const masterId = parseInt(e.target.value);
        const master = machineMasters.find(m => m.id === masterId);
        if (master) {
            setFormData({
                ...formData,
                machineMasterId: master.id.toString(),
                name: master.name,
                model: "",
                code: master.code
            });
        }
    };

    const toggleMachineSelection = (machineMasterId: string) => {
        setSelectedMachineIds(prev =>
            prev.includes(machineMasterId)
                ? prev.filter(id => id !== machineMasterId)
                : [...prev, machineMasterId]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedMachineIds(filteredMachinesForModal.map(m => m.id.toString()));
        } else {
            setSelectedMachineIds([]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        Swal.fire({
            title: 'Confirm Save',
            text: "Do you want to save these machine settings?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, save it!'
        }).then((result) => {
            if (result.isConfirmed) {
                // Bulk Create Logic
                if (!editingId && selectedMachineIds.length > 0) {
                    const machinesPayload = selectedMachineIds.map(masterId => {
                        const master = machineMasters.find(m => m.id === parseInt(masterId));
                        // Use Master data to upsert Machine
                        return {
                            machineMasterId: master?.id,
                            name: master?.name || "",
                            code: master?.code || "",
                            model: "", // Default empty
                            location: master?.machineType?.area?.name || "" // Default to Area
                        };
                    });

                    const payload = {
                        machineTypeId: formData.machineTypeId,
                        frequencyDays: formData.frequencyDays,
                        advanceNotifyDays: formData.advanceNotifyDays,
                        machines: machinesPayload
                    };

                    axios.post(`${config.apiServer}/api/machines/bulk`, payload)
                        .then((res) => {
                            fetchMachines();
                            const closeBtn = document.getElementById("addMachineModal_btnClose");
                            if (closeBtn) closeBtn.click();
                            resetForm();
                            Swal.fire({
                                title: 'Saved!',
                                text: `${res.data.count} machines have been added successfully.`,
                                icon: 'success',
                                timer: 300,
                                showConfirmButton: false
                            });
                        })
                        .catch((err) => {
                            console.error(err);
                            Swal.fire('Error!', err.response?.data?.error || 'Failed to save machines.', 'error');
                        });
                } else {
                    // Single Update Logic
                    const payload = {
                        ...formData,
                        machineTypeId: formData.machineTypeId,
                        // Ensure machineMasterId is correct for single edit
                        machineMasterId: formData.machineMasterId
                    };

                    const apiCall = editingId
                        ? axios.put(`${config.apiServer}/api/machines/${editingId}`, payload)
                        : axios.post(`${config.apiServer}/api/machines`, payload);

                    apiCall
                        .then(() => {
                            fetchMachines();
                            const closeBtn = document.getElementById("addMachineModal_btnClose");
                            if (closeBtn) closeBtn.click();
                            resetForm();
                            Swal.fire({
                                title: 'Saved!',
                                text: 'Machine settings have been saved.',
                                icon: 'success',
                                timer: 300,
                                showConfirmButton: false
                            });
                        })
                        .catch((err) => {
                            console.error(err);
                            Swal.fire('Error!', 'Failed to save machine settings.', 'error');
                        });
                }
            }
        });
    };

    const handlePmTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const typeId = e.target.value;

        // Find if this machine already has a plan for this type
        const existingPlan = currentPlans.find(p => p.preventiveTypeId === parseInt(typeId));

        if (existingPlan) {
            setFormData({
                ...formData,
                machineTypeId: typeId,
                frequencyDays: existingPlan.frequencyDays,
                advanceNotifyDays: existingPlan.advanceNotifyDays,
                nextPMDate: existingPlan.nextPMDate || ""
            });
        } else {
            // Reset to defaults if no plan exists for this type
            setFormData({
                ...formData,
                machineTypeId: typeId,
                frequencyDays: 30,
                advanceNotifyDays: 7,
                nextPMDate: ""
            });
        }
    };

    const handleEdit = async (machine: Machine) => {
        try {
            setSelectedMachineIds([]);
            // Fetch full machine details to ensure we have the nested hierarchy
            const res = await axios.get(`${config.apiServer}/api/machines/${machine.id}`);
            const fullMachine = res.data;

            setEditingId(fullMachine.id);
            const master = fullMachine.machineMaster;
            const mType = master?.machineType;
            const area = mType?.area;

            // Load existing plans
            const plans = fullMachine.pmPlans || [];
            setCurrentPlans(plans);

            // Determine initial values based on first plan if available
            const firstPlan = plans.length > 0 ? plans[0] : null;

            // Set Form Data
            setFormData({
                code: fullMachine.code,
                name: fullMachine.name,
                model: fullMachine.model || "",
                location: fullMachine.location || "",
                frequencyDays: firstPlan ? firstPlan.frequencyDays : 30,
                advanceNotifyDays: firstPlan ? firstPlan.advanceNotifyDays : 7,
                machineTypeId: firstPlan ? firstPlan.preventiveTypeId.toString() : "",
                machineMasterId: fullMachine.machineMaster?.id.toString() || "",
                areaId: area?.id?.toString() || "",
                machineTypeMasterId: mType?.id?.toString() || "",
                nextPMDate: firstPlan?.nextPMDate || ""
            });

            const modalBtn = document.getElementById('openModalBtn') as HTMLButtonElement;
            if (modalBtn) modalBtn.click();
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to fetch machine details', 'error');
        }
    };

    // Helper to delete a specific plan from a machine
    // Helper to delete a specific plan from a machine
    const handleDeletePlan = async (machineId: number, planId: number) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "This will remove the PM plan from this machine.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${config.apiServer}/api/machines/plans/${planId}`);
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Plan has been removed.',
                        icon: 'success',
                        timer: 300,
                        showConfirmButton: false
                    });

                    // Update UI immediately (Modal)
                    setCurrentPlans(prev => prev.filter(p => p.id !== planId));

                    // Update main table in background
                    fetchMachines();
                } catch (err: any) {
                    console.error(err);
                    Swal.fire('Error!', err.response?.data?.error || 'Failed to remove plan.', 'error');
                }
            }
        });
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
                axios.delete(`${config.apiServer}/api/machines/${id}`)
                    .then(() => {
                        fetchMachines();
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Machine has been deleted.',
                            icon: 'success',
                            timer: 300,
                            showConfirmButton: false
                        });
                    })
                    .catch(err => Swal.fire('Error!', 'Failed to delete machine.', 'error'));
            }
        });
    };

    const resetForm = () => {
        setSelectedMachineIds([]);
        setFormData({
            code: "",
            name: "",
            model: "",
            location: "",
            frequencyDays: 30,
            advanceNotifyDays: 7,
            machineTypeId: "",
            machineMasterId: "",
            areaId: "",
            machineTypeMasterId: "",
            nextPMDate: ""
        });
        setEditingId(null);
    };

    const handleBatchNotification = (type: 'web' | 'windows', action: 'enable' | 'disable') => {
        setNotificationPrefs(prev => {
            const newPrefs = { ...prev };
            const isEnable = action === 'enable';

            filteredMachines.forEach(m => {
                const current = newPrefs[m.id] || { web: true, windows: true };
                newPrefs[m.id] = { ...current, [type]: isEnable };
            });

            localStorage.setItem('notification_prefs_v2', JSON.stringify(newPrefs));
            // Trigger update immediately
            window.dispatchEvent(new Event('refreshNotifications'));
            return newPrefs;
        });

        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true
        });

        Toast.fire({
            icon: 'success',
            title: `${type === 'web' ? 'Web' : 'Windows'} Notifications ${action}d for ${filteredMachines.length} machines`
        });
    };

    return (
        <div className="container-fluid py-4 px-4 bg-light min-vh-100">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Machine Settings</h2>
                    <p className="text-muted mb-0">Manage your machines and preventive maintenance schedules</p>
                </div>
                <MachineSettingsNav>
                    {user?.systemRole === 'ADMIN' && (
                        <button className="btn btn-primary shadow-sm text-nowrap" onClick={() => { resetForm(); }} data-bs-toggle="modal" data-bs-target="#addMachineModal">
                            <i className="bi bi-plus-lg me-2"></i>Match Pm with M/C
                        </button>
                    )}
                    <button id="openModalBtn" className="d-none" data-bs-toggle="modal" data-bs-target="#addMachineModal"></button>
                </MachineSettingsNav>
            </div>

            {/* Filters Section */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-body p-4">
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label fw-bold small text-muted">Filter by Area</label>
                            <select className="form-select border-0 shadow-sm bg-light" name="area" value={filters.area} onChange={handleFilterChange}>
                                <option value="">All Areas</option>
                                {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold small text-muted">Filter by Machine Type</label>
                            <select className="form-select border-0 shadow-sm bg-light" name="type" value={filters.type} onChange={handleFilterChange} disabled={!filters.area && areas.length > 0}>
                                <option value="">All Types</option>
                                {availableTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold small text-muted">Filter by Machine Name</label>
                            <select className="form-select border-0 shadow-sm bg-light" name="name" value={filters.name} onChange={handleFilterChange} disabled={!filters.type && machineTypes.length > 0}>
                                <option value="">All Machines</option>
                                {Array.from(new Map(availableMachines.map(m => [m.name, m])).values()).map((m, idx) => (
                                    <option key={`${m.id}-${idx}`} value={m.name}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Batch Notification Controls */}
            <div className="d-flex justify-content-end mb-3 gap-3">
                <div className="d-flex align-items-center gap-2 border-end pe-3">
                    <small className="fw-bold text-muted">Web:</small>
                    <button className="btn btn-outline-success btn-sm shadow-sm" onClick={() => handleBatchNotification('web', 'enable')}>
                        Enable All
                    </button>
                    <button className="btn btn-outline-secondary btn-sm shadow-sm" onClick={() => handleBatchNotification('web', 'disable')}>
                        Disable All
                    </button>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <small className="fw-bold text-muted">Windows:</small>
                    <button className="btn btn-outline-success btn-sm shadow-sm" onClick={() => handleBatchNotification('windows', 'enable')}>
                        Enable All
                    </button>
                    <button className="btn btn-outline-secondary btn-sm shadow-sm" onClick={() => handleBatchNotification('windows', 'disable')}>
                        Disable All
                    </button>
                </div>
            </div>

            {/* Machines Table */}
            <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-secondary">
                                <tr>
                                    <th className="py-3 ps-4">No</th>
                                    <th className="py-3">Machine Name</th>
                                    <th className="py-3">Machine Type</th>
                                    <th className="py-3">Area</th>
                                    <th className="py-3 text-center">Preventive Type</th>
                                    <th className="py-3 text-center">Freq(Day)</th>
                                    <th className="py-3 text-center">Notify(Days)</th>
                                    <th className="py-3 text-center">Web Alert</th>
                                    <th className="py-3 text-center">Win Alert</th>
                                    <th className="py-3 text-center pe-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((m, index) => {
                                    const pref = notificationPrefs[m.id] || { web: true, windows: true };
                                    return (
                                        <tr key={m.id}>
                                            <td className="ps-4 text-muted">{indexOfFirstItem + index + 1}</td>
                                            <td>
                                                <div className="fw-bold text-dark">{m.name}</div>
                                                <small className="text-muted font-monospace" style={{ fontSize: '0.8em' }}>{m.code}</small>
                                            </td>
                                            <td>{m.machineMaster?.machineType?.name || "-"}</td>
                                            <td><span className="badge bg-light text-dark border fw-normal">{m.location}</span></td>
                                            <td className="text-center">
                                                {m.pmPlans && m.pmPlans.length > 0 ? (
                                                    m.pmPlans.map(p => (
                                                        <span key={p.id} className="badge bg-info text-dark rounded-pill fw-normal px-2 m-1">
                                                            {p.preventiveType?.name}
                                                        </span>
                                                    ))
                                                ) : "-"}
                                            </td>
                                            <td className="text-center fw-bold text-primary">
                                                {m.pmPlans?.map(p => p.frequencyDays).join(", ") || "-"}
                                            </td>
                                            <td className="text-center fw-bold text-warning">
                                                {m.pmPlans?.map(p => p.advanceNotifyDays).join(", ") || "-"}
                                            </td>
                                            <td className="text-center">
                                                <div className="form-check form-switch d-flex justify-content-center">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={pref.web}
                                                        onChange={() => toggleNotification(m.id, 'web')}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="form-check form-switch d-flex justify-content-center">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={pref.windows}
                                                        onChange={() => toggleNotification(m.id, 'windows')}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="text-center pe-4">

                                                <div className="d-flex gap-2 justify-content-center">
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(m)}>
                                                        <i className="bi bi-pencil-square me-1"></i> Edit
                                                    </button>
                                                    {user?.systemRole === 'ADMIN' && (
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(m.id)}>
                                                            <i className="bi bi-trash me-1"></i> Delete
                                                        </button>
                                                    )}
                                                </div>

                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredMachines.length === 0 && (
                                    <tr><td colSpan={10} className="text-center py-5 text-muted">
                                        <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                                        No machines found matching your filters.
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="mt-4">
                <Pagination
                    totalItems={filteredMachines.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Add/Edit Modal */}
            <MyModal id="addMachineModal" title={editingId ? "Edit Machine Settings" : "Add Machine to Preventive"}>
                <form onSubmit={handleSubmit}>
                    <div className="alert alert-info shadow-sm mb-4">
                        <i className="bi bi-info-circle-fill me-2"></i>
                        <small>Select a PM Type first, then choose which machines to assign to it.</small>
                    </div>

                    {editingId && currentPlans.length > 0 && (
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted">Current PM Plans</label>
                            <div className="table-responsive border rounded bg-white">
                                <table className="table table-sm table-striped mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th>Type</th>
                                            <th>Freq</th>
                                            <th>Next Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentPlans.map(p => (
                                            <tr key={p.id}>
                                                <td>{p.preventiveType?.name}</td>
                                                <td>{p.frequencyDays}</td>
                                                <td>{p.nextPMDate ? new Date(p.nextPMDate).toLocaleDateString() : '-'}</td>
                                                <td>
                                                    {user?.systemRole === 'ADMIN' && (
                                                        <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => handleDeletePlan(editingId!, p.id)}>
                                                            Remove
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="form-label fw-bold small text-muted">
                            {editingId
                                ? (user?.systemRole === 'ADMIN' ? "Add / Update Preventive Type" : "Update Preventive Type")
                                : "1. Select Preventive Type (Schedule)"}
                        </label>
                        <select className="form-select" name="machineTypeId" value={formData.machineTypeId} onChange={handlePmTypeChange} required={!editingId}>
                            <option value="">-- Select Preventive Type --</option>
                            {preventiveTypes
                                .filter(t => user?.systemRole === 'ADMIN' || currentPlans.some(p => p.preventiveTypeId === t.id))
                                .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        {editingId && <div className="form-text">Select a type to add a new plan or update an existing one.</div>}
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">2. Select Machines</label>

                        <div className="card bg-light border-0 p-3 mb-3">
                            <div className="row g-2 mb-2">
                                <div className="col-6">
                                    <label className="form-label small text-muted">Area</label>
                                    <select className="form-select form-select-sm" value={formData.areaId} onChange={handleAreaChange} disabled={!!editingId}>
                                        <option value="">-- All Areas --</option>
                                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-6">
                                    <label className="form-label small text-muted">Machine Type</label>
                                    <select className="form-select form-select-sm" value={formData.machineTypeMasterId} onChange={handleMachineTypeChange} disabled={!formData.areaId || !!editingId}>
                                        <option value="">-- All Types --</option>
                                        {filteredMachineTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {editingId && (
                                <div className="mt-2">
                                    <label className="form-label small text-muted">Machine Name (Machine Code)</label>
                                    <select className="form-select form-select-sm" value={formData.machineMasterId} onChange={handleMasterChange} disabled={true}>
                                        {filteredMachineMasters.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {!editingId && (
                            // Add Mode: Multi Select List
                            <div className="card border shadow-sm" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                <div className="card-header bg-light py-2">
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" onChange={handleSelectAll} checked={selectedMachineIds.length > 0 && selectedMachineIds.length === filteredMachinesForModal.length} disabled={filteredMachinesForModal.length === 0} />
                                        <label className="form-check-label small fw-bold">Select All Available</label>
                                    </div>
                                </div>
                                <ul className="list-group list-group-flush">
                                    {filteredMachinesForModal.length === 0 ? (
                                        <li className="list-group-item text-muted small fst-italic text-center py-4">No machines found with current filters</li>
                                    ) : (
                                        filteredMachinesForModal.map(m => (
                                            <li key={m.id} className="list-group-item">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`checkbox_machine_${m.id}`}
                                                        value={m.id}
                                                        checked={selectedMachineIds.includes(m.id.toString())}
                                                        onChange={() => toggleMachineSelection(m.id.toString())}
                                                    />
                                                    <label className="form-check-label w-100 stretched-link cursor-pointer" htmlFor={`checkbox_machine_${m.id}`}>
                                                        {m.name} <span className="text-muted small ms-2">({m.code})</span>
                                                    </label>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        )}
                        <div className="form-text text-end">
                            {editingId ? "Cannot change machine in edit mode." : `${selectedMachineIds.length} / ${filteredMachinesForModal.length} machines selected.`}
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">3. Schedule Mode</label>
                        <div className="d-flex gap-3 mb-2">
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="scheduleMode" id="modeAuto"
                                    checked={formData.frequencyDays > 0}
                                    onChange={() => setFormData({ ...formData, frequencyDays: 30 })}
                                />
                                <label className="form-check-label" htmlFor="modeAuto">
                                    Automatic (Recurring)
                                </label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="scheduleMode" id="modeManual"
                                    checked={formData.frequencyDays === 0}
                                    onChange={() => setFormData({ ...formData, frequencyDays: 0 })}
                                />
                                <label className="form-check-label" htmlFor="modeManual">
                                    Manual (No Schedule)
                                </label>
                            </div>
                        </div>
                    </div>

                    {formData.frequencyDays > 0 && (
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-bold small text-muted">Frequency (Days)</label>
                                <div className="input-group">
                                    <input type="number" className="form-control" name="frequencyDays" value={formData.frequencyDays} onChange={handleInputChange} min="1" required />
                                    <span className="input-group-text bg-light">Days</span>
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-bold small text-muted">Advance Notify (Days)</label>
                                <div className="input-group">
                                    <input type="number" className="form-control" name="advanceNotifyDays" value={formData.advanceNotifyDays} onChange={handleInputChange} required />
                                    <span className="input-group-text bg-light">Days</span>
                                </div>
                            </div>
                        </div>
                    )}


                    {editingId && (
                        <div className="mb-3">
                            <label className="form-label fw-bold small text-muted">Next PM Date (Reschedule)</label>
                            <input
                                type="date"
                                className="form-control"
                                name="nextPMDate"
                                value={formData.nextPMDate}
                                onChange={handleInputChange}
                            />
                            <div className="form-text">Changing this will reset the PM cycle to start from this date.</div>
                        </div>
                    )}

                    <div className="text-end mt-4 pt-3 border-top">
                        <button type="button" id="addMachineModal_btnClose" className="btn btn-light border me-2" data-bs-dismiss="modal">Close</button>
                        <button type="submit" className="btn btn-primary px-4 shadow-sm" disabled={!editingId && (selectedMachineIds.length === 0 || !formData.machineTypeId)}>
                            {editingId ? "Update Settings" : `Add ${selectedMachineIds.length > 0 ? selectedMachineIds.length : ''} Machines`}
                        </button>
                    </div>
                </form>
            </MyModal>
        </div >
    );
}
