"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MachineSettingsNav from "../components/MachineSettingsNav";
import axios from "axios";
import config from "../../config";
import MyModal from "../../components/MyModal";
import Swal from 'sweetalert2';
import Pagination from "../../components/Pagination";

interface MachineMaster {
    id: number;
    code: string;
    name: string;
    description: string;
    machineTypeId?: number;
    machineType?: {
        id: number;
        name: string;
        area?: {
            id: number;
            name: string;
        }
    };
}

export default function MachineMasterPage() {
    const [masters, setMasters] = useState<MachineMaster[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [formData, setFormData] = useState({ code: "", name: "", description: "", machineTypeId: "" });
    const [editingId, setEditingId] = useState<number | null>(null);

    // Filters
    const [filters, setFilters] = useState({ area: "", type: "" });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        fetchMasters();
        fetchTypes();
        // Load filters from localStorage
        const savedFilters = localStorage.getItem('machineMasterFilters');
        if (savedFilters) {
            setFilters(JSON.parse(savedFilters));
        }
        setIsLoaded(true);
    }, []);

    // Save filters to localStorage whenever they change
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('machineMasterFilters', JSON.stringify(filters));
    }, [filters, isLoaded]);

    const fetchMasters = () => {
        axios.get(`${config.apiServer}/api/machine-master`)
            .then(res => setMasters(res.data))
            .catch(err => console.error(err));
    };

    const fetchTypes = () => {
        axios.get(`${config.apiServer}/api/machine-types`)
            .then(res => setTypes(res.data))
            .catch(err => console.error(err));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            axios.put(`${config.apiServer}/api/machine-master/${editingId}`, formData)
                .then(() => {
                    fetchMasters();
                    resetForm();
                    Swal.fire({
                        title: 'Success',
                        text: 'Machine Master updated successfully',
                        icon: 'success',
                        timer: 300,
                        showConfirmButton: false
                    });
                })
                .catch(err => Swal.fire('Error', 'Failed to update master', 'error'));
        } else {
            axios.post(`${config.apiServer}/api/machine-master`, formData)
                .then(() => {
                    fetchMasters();
                    resetForm();
                    Swal.fire({
                        title: 'Success',
                        text: 'Machine Master created successfully',
                        icon: 'success',
                        timer: 300,
                        showConfirmButton: false
                    });
                })
                .catch(err => Swal.fire('Error', 'Failed to create master', 'error'));
        }
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`${config.apiServer}/api/machine-master/${id}`)
                    .then(() => {
                        fetchMasters();
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Machine Master has been deleted.',
                            icon: 'success',
                            timer: 300,
                            showConfirmButton: false
                        });
                    })
                    .catch(err => Swal.fire('Error', 'Failed to delete master', 'error'));
            }
        });
    };

    const handleEdit = (master: MachineMaster) => {
        setFormData({
            code: master.code,
            name: master.name,
            description: master.description,
            machineTypeId: master.machineTypeId ? master.machineTypeId.toString() : ""
        });
        setEditingId(master.id);
        const modalBtn = document.getElementById("openModalBtn");
        if (modalBtn) modalBtn.click();
    };

    const resetForm = () => {
        setFormData({ code: "", name: "", description: "", machineTypeId: "" });
        setEditingId(null);
        const closeBtn = document.getElementById("masterModal_btnClose");
        if (closeBtn) closeBtn.click();
    };

    // Filter Logic
    const uniqueAreas = Array.from(new Set(types.map(t => t.area?.name).filter(Boolean)));

    // Filter types based on selected area
    const availableTypes = types.filter(t => !filters.area || t.area?.name === filters.area);

    const filteredMasters = masters.filter(m => {
        const areaName = m.machineType?.area?.name || "";
        const typeName = m.machineType?.name || "";

        return (
            (!filters.area || areaName === filters.area) &&
            (!filters.type || typeName === filters.type)
        );
    });

    const handleFilterChange = (name: string, value: string) => {
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            if (name === 'area') {
                newFilters.type = ""; // Reset type when area changes
            }
            return newFilters;
        });
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMasters.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Machine Name Master</h2>
                    <p className="text-muted mb-0">Define standard machine names and codes</p>
                </div>
                <MachineSettingsNav>
                    <button id="openModalBtn" className="btn btn-primary shadow-sm" data-bs-toggle="modal" data-bs-target="#masterModal" onClick={() => setEditingId(null)}>
                        <i className="bi bi-plus-lg me-2"></i>New Master
                    </button>
                </MachineSettingsNav>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-body p-4">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-bold small text-muted">Filter by Area</label>
                            <select
                                className="form-select border-0 shadow-sm bg-light"
                                value={filters.area}
                                onChange={(e) => handleFilterChange('area', e.target.value)}
                            >
                                <option value="">All Areas</option>
                                {uniqueAreas.map((area: any) => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold small text-muted">Filter by Machine Type</label>
                            <select
                                className="form-select border-0 shadow-sm bg-light"
                                value={filters.type}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                disabled={!filters.area && uniqueAreas.length > 0} // Optional strategy: disable if no area selected, or allow all
                            >
                                <option value="">All Types</option>
                                {availableTypes.map((t: any) => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-secondary">
                                <tr>
                                    <th className="py-3 ps-4">No</th>
                                    <th className="py-3">Area</th>
                                    <th className="py-3">Machine Type</th>
                                    <th className="py-3">Code</th>
                                    <th className="py-3">Name</th>
                                    <th className="py-3">Description</th>
                                    <th className="py-3 text-center pe-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((m: any, index: number) => (
                                    <tr key={m.id}>
                                        <td className="ps-4 text-muted">{indexOfFirstItem + index + 1}</td>
                                        <td><span className="badge bg-light text-dark border fw-normal">{m.machineType?.area?.name || "-"}</span></td>
                                        <td>{m.machineType?.name || "-"}</td>
                                        <td><span className="font-monospace text-primary fw-bold">{m.code}</span></td>
                                        <td className="fw-bold">{m.name}</td>
                                        <td className="text-muted small">{m.description}</td>
                                        <td className="text-center pe-4">
                                            <button className="btn btn-sm btn-outline-warning me-2" onClick={() => handleEdit(m)}>
                                                <i className="bi bi-pencil me-1"></i> Edit
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(m.id)}>
                                                <i className="bi bi-trash me-1"></i> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredMasters.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-5 text-muted">No machine masters found matching your filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="mt-4">
                <Pagination
                    totalItems={filteredMasters.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Modal */}
            <MyModal id="masterModal" title={editingId ? "Edit Machine Master" : "Create Machine Master"}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Machine Type</label>
                        <select className="form-select" value={formData.machineTypeId} onChange={e => setFormData({ ...formData, machineTypeId: e.target.value })} required>
                            <option value="">-- Select Type --</option>
                            {types.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.area?.name || "No Area"})</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Machine Code</label>
                        <input type="text" className="form-control" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required placeholder="e.g. MC-001" />
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Machine Name</label>
                        <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Injection Machine A" />
                    </div>
                    <div className="mb-4">
                        <label className="form-label fw-bold small text-muted">Description</label>
                        <textarea className="form-control" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description..."></textarea>
                    </div>
                    <div className="text-end pt-3 border-top">
                        <button type="button" id="masterModal_btnClose" className="btn btn-light border me-2" data-bs-dismiss="modal">Close</button>
                        <button type="submit" className="btn btn-primary px-4 shadow-sm">{editingId ? "Update" : "Create"}</button>
                    </div>
                </form>
            </MyModal>
        </div>
    );
}
