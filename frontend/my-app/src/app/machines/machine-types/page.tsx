"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MachineSettingsNav from "../components/MachineSettingsNav";
import axios from "axios";
import config from "../../config";
import Swal from 'sweetalert2';
import MyModal from "../../components/MyModal";
import Pagination from "../../components/Pagination";

interface MachineType {
    id: number;
    name: string;
    description: string;
    areaId: number;
    area?: {
        name: string;
    };
}

interface Area {
    id: number;
    name: string;
}

export default function MachineTypeMaster() {
    const [types, setTypes] = useState<MachineType[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [formData, setFormData] = useState({ name: "", description: "", areaId: "" });
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        fetchTypes();
        fetchAreas();
    }, []);

    const fetchTypes = () => {
        axios.get(`${config.apiServer}/api/machine-types`)
            .then(res => setTypes(res.data))
            .catch(err => console.error(err));
    };

    const fetchAreas = () => {
        axios.get(`${config.apiServer}/api/areas`)
            .then(res => setAreas(res.data))
            .catch(err => console.error(err));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            axios.put(`${config.apiServer}/api/machine-types/${editingId}`, formData)
                .then(() => {
                    fetchTypes();
                    resetForm();
                    Swal.fire({
                        title: 'Success',
                        text: 'Machine Type updated successfully',
                        icon: 'success',
                        timer: 300,
                        showConfirmButton: false
                    });
                    document.getElementById('closeTypeModal')?.click();
                })
                .catch(err => Swal.fire('Error', 'Failed to update machine type', 'error'));
        } else {
            axios.post(`${config.apiServer}/api/machine-types`, formData)
                .then(() => {
                    fetchTypes();
                    resetForm();
                    Swal.fire({
                        title: 'Success',
                        text: 'Machine Type created successfully',
                        icon: 'success',
                        timer: 300,
                        showConfirmButton: false
                    });
                    document.getElementById('closeTypeModal')?.click();
                })
                .catch(err => Swal.fire('Error', 'Failed to create machine type', 'error'));
        }
    };

    const handleEdit = (type: MachineType) => {
        setFormData({
            name: type.name,
            description: type.description || "",
            areaId: type.areaId ? type.areaId.toString() : ""
        });
        setEditingId(type.id);
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
                axios.delete(`${config.apiServer}/api/machine-types/${id}`)
                    .then(() => {
                        fetchTypes();
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Machine Type has been deleted.',
                            icon: 'success',
                            timer: 300,
                            showConfirmButton: false
                        });
                    })
                    .catch(err => Swal.fire('Error', 'Failed to delete machine type', 'error'));
            }
        });
    };

    const resetForm = () => {
        setFormData({ name: "", description: "", areaId: "" });
        setEditingId(null);
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = types.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Machine Type Master</h2>
                    <p className="text-muted mb-0">Categorize machines by type and area</p>
                </div>
                <MachineSettingsNav>
                    <button className="btn btn-primary shadow-sm" data-bs-toggle="modal" data-bs-target="#typeModal" onClick={resetForm}>
                        <i className="bi bi-plus-lg me-2"></i>Add Machine Type
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
                                    <th className="py-3">Area</th>
                                    <th className="py-3">Description</th>
                                    <th className="py-3 text-center pe-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((type, index) => (
                                    <tr key={type.id}>
                                        <td className="ps-4 text-muted">{indexOfFirstItem + index + 1}</td>
                                        <td className="fw-bold">{type.name}</td>
                                        <td><span className="badge bg-light text-dark border fw-normal">{type.area?.name || "-"}</span></td>
                                        <td className="text-muted small">{type.description}</td>
                                        <td className="text-center pe-4">
                                            <button className="btn btn-sm btn-outline-warning me-2" data-bs-toggle="modal" data-bs-target="#typeModal" onClick={() => handleEdit(type)}>
                                                <i className="bi bi-pencil me-1"></i> Edit
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(type.id)}>
                                                <i className="bi bi-trash me-1"></i> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {types.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-5 text-muted">No machine types found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="mt-4">
                <Pagination
                    totalItems={types.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Modal */}
            <MyModal id="typeModal" title={editingId ? "Edit Machine Type" : "Add Machine Type"}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Area</label>
                        <select className="form-select" required
                            value={formData.areaId}
                            onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                        >
                            <option value="">Select Area</option>
                            {areas.map(area => (
                                <option key={area.id} value={area.id}>{area.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Type Name</label>
                        <input type="text" className="form-control" required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Injection Molding"
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
                        <button type="button" id="closeTypeModal" className="btn btn-light border me-2" data-bs-dismiss="modal">Close</button>
                        <button type="submit" className="btn btn-primary px-4 shadow-sm">{editingId ? "Update" : "Save"}</button>
                    </div>
                </form>
            </MyModal>
        </div>
    );
}
