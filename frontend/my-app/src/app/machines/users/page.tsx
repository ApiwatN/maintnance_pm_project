"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import Swal from "sweetalert2";
import Link from "next/link";
import MachineSettingsNav from "../components/MachineSettingsNav";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";

interface User {
    id: number;
    employeeId: string;
    name: string;
    email: string;
    role: string;
    username?: string;
    password?: string;
    systemRole: string;
    assignedMachines?: { id: number; name: string; code: string }[];
}

interface Machine {
    id: number;
    name: string;
    code: string;
    machineMaster?: {
        machineType?: {
            name: string;
            area?: {
                name: string;
            }
        }
    }
}

export default function UserMasterPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [isAuthEnabled, setIsAuthEnabled] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: "",
        name: "",
        email: "",
        role: "INSPECTOR", // Default
        username: "",
        password: "",
        systemRole: "USER",
        assignedMachineIds: [] as string[]
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();

    // Protect Route
    useEffect(() => {
        if (!authLoading && currentUser?.systemRole !== 'ADMIN') {
            router.push('/');
        }
    }, [currentUser, authLoading, router]);

    useEffect(() => {
        if (currentUser?.systemRole === 'ADMIN') {
            fetchUsers();
            fetchMachines();
        }
    }, [currentUser]);

    const fetchUsers = () => {
        axios.get(`${config.apiServer}/api/user-master`)
            .then(res => setUsers(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const fetchMachines = () => {
        axios.get(`${config.apiServer}/api/machines`)
            .then(res => setMachines(res.data))
            .catch(err => console.error(err));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleMachineToggle = (machineId: string) => {
        setFormData(prev => {
            const current = prev.assignedMachineIds;
            if (current.includes(machineId)) {
                return { ...prev, assignedMachineIds: current.filter(id => id !== machineId) };
            } else {
                return { ...prev, assignedMachineIds: [...current, machineId] };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            // If username is empty, send null/undefined to backend
            username: formData.username || undefined,
            password: formData.password || undefined,
            systemRole: formData.username ? formData.systemRole : "USER", // Default if no login
            // Only send password if it's not empty (for edit) or if it's create
            ...(editingId && !formData.password ? { password: undefined } : {})
        };

        const apiCall = editingId
            ? axios.put(`${config.apiServer}/api/user-master/${editingId}`, payload)
            : axios.post(`${config.apiServer}/api/user-master`, payload);

        apiCall
            .then(() => {
                fetchUsers();
                resetForm();
                const closeBtn = document.getElementById("userModal_btnClose");
                if (closeBtn) closeBtn.click();
                Swal.fire({
                    title: "Success",
                    text: "User saved successfully",
                    icon: "success",
                    timer: 300,
                    showConfirmButton: false
                });
            })
            .catch(err => {
                console.error(err);
                Swal.fire("Error", err.response?.data?.error || "Failed to save user", "error");
            });
    };

    const handleEdit = (user: User) => {
        setEditingId(user.id);
        setIsAuthEnabled(!!user.username);
        setFormData({
            employeeId: user.employeeId || "",
            name: user.name,
            email: user.email || "",
            role: user.role,
            username: user.username || "",
            password: user.password || "", // Show password as plain text
            systemRole: user.systemRole || "USER",
            assignedMachineIds: user.assignedMachines?.map(m => m.id.toString()) || []
        });
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`${config.apiServer}/api/user-master/${id}`)
                    .then(() => {
                        fetchUsers();
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'User has been deleted.',
                            icon: 'success',
                            timer: 300,
                            showConfirmButton: false
                        });
                    })
                    .catch(err => Swal.fire('Error!', 'Failed to delete user.', 'error'));
            }
        });
    };

    const resetForm = () => {
        setEditingId(null);
        setIsAuthEnabled(false);
        setFormData({
            employeeId: "",
            name: "",
            email: "",
            role: "INSPECTOR",
            username: "",
            password: "",
            systemRole: "USER",
            assignedMachineIds: []
        });
    };

    if (authLoading || loading) return <div className="p-5 text-center">Loading...</div>;

    return (
        <div className="container-fluid py-4 px-4 bg-light min-vh-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">User Management</h2>
                    <p className="text-muted mb-0">Manage system users and access rights</p>
                </div>
                <MachineSettingsNav>
                    <button className="btn btn-primary shadow-sm" onClick={resetForm} data-bs-toggle="modal" data-bs-target="#userModal">
                        <i className="bi bi-plus-lg me-2"></i>Add User
                    </button>
                </MachineSettingsNav>
            </div>

            <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-secondary">
                                <tr>
                                    <th className="py-3 ps-4">Name</th>
                                    <th className="py-3">Username</th>
                                    <th className="py-3">Role (Job)</th>
                                    <th className="py-3">System Role</th>
                                    <th className="py-3">Assigned Machines</th>
                                    <th className="py-3 text-center pe-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-dark">{u.name}</div>
                                            <small className="text-muted">{u.employeeId}</small>
                                        </td>
                                        <td>{u.username || "-"}</td>
                                        <td>
                                            {u.role === 'NONE' ? (
                                                <span className="badge bg-light text-muted border">None</span>
                                            ) : (
                                                <span className="badge bg-light text-dark border">{u.role}</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${u.systemRole === 'ADMIN' ? 'bg-primary' : 'bg-secondary'} rounded-pill`}>
                                                {u.systemRole}
                                            </span>
                                        </td>
                                        <td>
                                            {u.systemRole === 'ADMIN' ? (
                                                <span className="text-success fw-bold">All Machines (Admin)</span>
                                            ) : (
                                                <small className="text-muted">
                                                    {u.assignedMachines?.length ? `${u.assignedMachines.length} machines` : 'None'}
                                                </small>
                                            )}
                                        </td>
                                        <td className="text-center pe-4">
                                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(u)} data-bs-toggle="modal" data-bs-target="#userModal">
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <div className="modal fade" id="userModal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title fw-bold">{editingId ? "Edit User" : "Add User"}</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" id="userModal_btnClose"></button>
                        </div>
                        <div className="modal-body p-4">
                            <form onSubmit={handleSubmit}>
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-muted">Full Name</label>
                                        <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-muted">Employee ID</label>
                                        <input type="text" className="form-control" name="employeeId" value={formData.employeeId} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-muted">Job Role</label>
                                        <select className="form-select" name="role" value={formData.role} onChange={handleInputChange}>
                                            <option value="INSPECTOR">Inspector</option>
                                            <option value="CHECKER">Checker</option>
                                            <option value="BOTH">Both</option>
                                            <option value="NONE">None (System Admin Only)</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-muted">Email</label>
                                        <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} />
                                    </div>
                                </div>

                                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3 mt-4">
                                    <div className="form-check form-switch d-flex align-items-center">
                                        <input
                                            className="form-check-input me-2"
                                            type="checkbox"
                                            id="enableAuth"
                                            checked={isAuthEnabled}
                                            onChange={(e) => {
                                                setIsAuthEnabled(e.target.checked);
                                                if (!e.target.checked) {
                                                    setFormData({ ...formData, username: "", password: "", systemRole: "USER" });
                                                }
                                            }}
                                        />
                                        <label className="form-check-label mb-0" htmlFor="enableAuth">Enable System Access (Login)</label>
                                    </div>
                                </h6>

                                {isAuthEnabled && (
                                    <>
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-muted">Username</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-muted">Password</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    placeholder={editingId ? "Leave blank to keep same" : "Required"}
                                                    required={!editingId}
                                                />
                                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Stored as Plain Text</small>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-muted">System Role</label>
                                                <select className="form-select" name="systemRole" value={formData.systemRole} onChange={handleInputChange}>
                                                    <option value="USER">User</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {formData.systemRole !== 'ADMIN' && (
                                    <>
                                        <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Assigned Machines</h6>
                                        <div className="border rounded p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {Object.entries(
                                                machines.reduce((acc, m) => {
                                                    const areaName = m.machineMaster?.machineType?.area?.name || "Unassigned Area";
                                                    const typeName = m.machineMaster?.machineType?.name || "Unassigned Type";
                                                    if (!acc[areaName]) acc[areaName] = {};
                                                    if (!acc[areaName][typeName]) acc[areaName][typeName] = [];
                                                    acc[areaName][typeName].push(m);
                                                    return acc;
                                                }, {} as Record<string, Record<string, Machine[]>>)
                                            ).map(([areaName, types]) => (
                                                <div key={areaName} className="mb-3 border rounded p-2 bg-light">
                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                        <span className="fw-bold text-primary">{areaName}</span>
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`area-${areaName}`}
                                                                checked={Object.values(types).flat().every(m => formData.assignedMachineIds.includes(m.id.toString()))}
                                                                onChange={(e) => {
                                                                    const areaMachines = Object.values(types).flat();
                                                                    const ids = areaMachines.map(m => m.id.toString());
                                                                    setFormData(prev => {
                                                                        let newIds = [...prev.assignedMachineIds];
                                                                        if (e.target.checked) {
                                                                            ids.forEach(id => { if (!newIds.includes(id)) newIds.push(id); });
                                                                        } else {
                                                                            newIds = newIds.filter(id => !ids.includes(id));
                                                                        }
                                                                        return { ...prev, assignedMachineIds: newIds };
                                                                    });
                                                                }}
                                                            />
                                                            <label className="form-check-label small fw-bold" htmlFor={`area-${areaName}`}>Select All Area</label>
                                                        </div>
                                                    </div>

                                                    <div className="ps-3">
                                                        {Object.entries(types).map(([typeName, typeMachines]) => (
                                                            <div key={typeName} className="mb-2">
                                                                <div className="d-flex align-items-center justify-content-between mb-1">
                                                                    <span className="fw-bold small text-secondary">{typeName}</span>
                                                                    <div className="form-check">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            id={`type-${areaName}-${typeName}`}
                                                                            checked={typeMachines.every(m => formData.assignedMachineIds.includes(m.id.toString()))}
                                                                            onChange={(e) => {
                                                                                const ids = typeMachines.map(m => m.id.toString());
                                                                                setFormData(prev => {
                                                                                    let newIds = [...prev.assignedMachineIds];
                                                                                    if (e.target.checked) {
                                                                                        ids.forEach(id => { if (!newIds.includes(id)) newIds.push(id); });
                                                                                    } else {
                                                                                        newIds = newIds.filter(id => !ids.includes(id));
                                                                                    }
                                                                                    return { ...prev, assignedMachineIds: newIds };
                                                                                });
                                                                            }}
                                                                        />
                                                                        <label className="form-check-label small text-muted" htmlFor={`type-${areaName}-${typeName}`}>Select All Type</label>
                                                                    </div>
                                                                </div>
                                                                <div className="row g-2 ps-2">
                                                                    {typeMachines.map(m => (
                                                                        <div key={m.id} className="col-md-6">
                                                                            <div className="form-check bg-white border rounded p-1 ps-4">
                                                                                <input
                                                                                    className="form-check-input"
                                                                                    type="checkbox"
                                                                                    id={`machine-${m.id}`}
                                                                                    checked={formData.assignedMachineIds.includes(m.id.toString())}
                                                                                    onChange={() => handleMachineToggle(m.id.toString())}
                                                                                />
                                                                                <label className="form-check-label small text-truncate d-block" htmlFor={`machine-${m.id}`} title={m.name}>
                                                                                    {m.name} <span className="text-muted">({m.code})</span>
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="mt-4 text-end">
                                    <button type="button" className="btn btn-light border me-2" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
