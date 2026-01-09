"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MachineSettingsNav from "../components/MachineSettingsNav";
import axios from "axios";
import config from "../../config";
import Swal from 'sweetalert2';
import MyModal from "../../components/MyModal";
import Pagination from "../../components/Pagination";

interface Area {
    id: number;
    name: string;
    description: string;
}

export default function AreaMaster() {
    const [areas, setAreas] = useState<Area[]>([]);
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [editingId, setEditingId] = useState<number | null>(null);

    // [NEW] Server-Side Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 12;

    useEffect(() => {
        fetchAreas();
    }, [currentPage]); // Re-fetch when page changes

    const fetchAreas = () => {
        axios.get(`${config.apiServer}/api/areas`, {
            params: { page: currentPage, limit: itemsPerPage }
        })
            .then(res => {
                // Handle paginated response
                if (res.data.pagination) {
                    setAreas(res.data.data);
                    setTotalItems(res.data.pagination.total);
                } else {
                    // Backward compatible - old format
                    setAreas(res.data);
                    setTotalItems(res.data.length);
                }
            })
            .catch(err => console.error(err));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            axios.put(`${config.apiServer}/api/areas/${editingId}`, formData)
                .then(() => {
                    fetchAreas();
                    resetForm();
                    Swal.fire({
                        title: 'Success',
                        text: 'Area updated successfully',
                        icon: 'success',
                        timer: 300,
                        showConfirmButton: false
                    });
                    document.getElementById('closeAreaModal')?.click();
                })
                .catch(err => Swal.fire('Error', 'Failed to update area', 'error'));
        } else {
            axios.post(`${config.apiServer}/api/areas`, formData)
                .then(() => {
                    fetchAreas();
                    resetForm();
                    Swal.fire({
                        title: 'Success',
                        text: 'Area created successfully',
                        icon: 'success',
                        timer: 300,
                        showConfirmButton: false
                    });
                    document.getElementById('closeAreaModal')?.click();
                })
                .catch(err => Swal.fire('Error', 'Failed to create area', 'error'));
        }
    };

    const handleEdit = (area: Area) => {
        setFormData({ name: area.name, description: area.description || "" });
        setEditingId(area.id);
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
                axios.delete(`${config.apiServer}/api/areas/${id}`)
                    .then(() => {
                        fetchAreas();
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Area has been deleted.',
                            icon: 'success',
                            timer: 300,
                            showConfirmButton: false
                        });
                    })
                    .catch(err => Swal.fire('Error', 'Failed to delete area', 'error'));
            }
        });
    };

    const resetForm = () => {
        setFormData({ name: "", description: "" });
        setEditingId(null);
    };

    // [NEW] Data is already paginated from server - use directly
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Area Master</h2>
                    <p className="text-muted mb-0">Manage factory areas and locations</p>
                </div>
                <MachineSettingsNav>
                    <button className="btn btn-primary shadow-sm" data-bs-toggle="modal" data-bs-target="#areaModal" onClick={resetForm}>
                        <i className="bi bi-plus-lg me-2"></i>Add Area
                    </button>
                </MachineSettingsNav>
            </div>

            {/* Table Card */}
            <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-secondary">
                                <tr>
                                    <th className="py-3 ps-4">No</th>
                                    <th className="py-3">Name</th>
                                    <th className="py-3">Description</th>
                                    <th className="py-3 text-center pe-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {areas.map((area, index) => (
                                    <tr key={area.id}>
                                        <td className="ps-4 text-muted">{indexOfFirstItem + index + 1}</td>
                                        <td className="fw-bold">{area.name}</td>
                                        <td className="text-muted">{area.description}</td>
                                        <td className="text-center pe-4">
                                            <button className="btn btn-sm btn-outline-warning me-2" data-bs-toggle="modal" data-bs-target="#areaModal" onClick={() => handleEdit(area)}>
                                                <i className="bi bi-pencil me-1"></i> Edit
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(area.id)}>
                                                <i className="bi bi-trash me-1"></i> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {areas.length === 0 && (
                                    <tr><td colSpan={4} className="text-center py-5 text-muted">No areas found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="mt-4">
                <Pagination
                    totalItems={areas.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Modal */}
            <MyModal id="areaModal" title={editingId ? "Edit Area" : "Add Area"}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Area Name</label>
                        <input type="text" className="form-control" required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Factory 1"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label fw-bold small text-muted">Description</label>
                        <textarea className="form-control" rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional description..."
                        />
                    </div>
                    <div className="text-end pt-3 border-top">
                        <button type="button" id="closeAreaModal" className="btn btn-light border me-2" data-bs-dismiss="modal">Close</button>
                        <button type="submit" className="btn btn-primary px-4 shadow-sm">{editingId ? "Update" : "Save"}</button>
                    </div>
                </form>
            </MyModal>
        </div>
    );
}
