"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MachineSettingsNav from "../components/MachineSettingsNav";
import axios from "axios";
import config from "../../config";
import MyModal from "../../components/MyModal";
import Swal from 'sweetalert2';
import { useAuth } from "../../../context/AuthContext"; // [NEW] Import useAuth

// [NEW] DnD Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MasterChecklist {
    id: number;
    topic: string;
    type: string;
    minVal?: number;
    maxVal?: number;
    options?: string; // JSON string for options
    isRequired?: boolean;
    useValueLimit?: boolean;
    valueLimitCount?: number;
    valueLimitHours?: number;
    isActive?: boolean;
    order: number;
}

interface MachineType {
    id: number;
    name: string;
    description: string;
    image?: string;
    isFixedDate?: boolean; // [NEW]
    postponeLogic?: string; // [NEW] "SHIFT" or "MAINTAIN_CYCLE"
    masterChecklists: MasterChecklist[];
}

// [NEW] Flexible Sortable Row Component
const SortableRow = ({ id, children }: { id: number, children: (listeners: any) => React.ReactNode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 999 : 'auto',
        position: isDragging ? 'relative' as 'relative' : undefined,
        backgroundColor: isDragging ? '#fcfcfc' : undefined,
        boxShadow: isDragging ? '0 0 15px rgba(0,0,0,0.1)' : undefined,
        opacity: isDragging ? 0.9 : 1
    };

    return (
        <tr ref={setNodeRef} style={style} {...attributes}>
            {children(listeners)}
        </tr>
    );
};

// [NEW] Sortable Row Component


export default function PreventiveTypes() {
    const { isAuthenticated, loading } = useAuth(); // [FIX] loading instead of authLoading
    const [types, setTypes] = useState<MachineType[]>([]);
    const [selectedType, setSelectedType] = useState<MachineType | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "", image: "", isFixedDate: true, postponeLogic: "SHIFT", emailRecipients: "", notifyAdvanceDays: 3 }); // [UPDATED] Removed notifyTime
    const [checklistData, setChecklistData] = useState({
        topic: "",
        type: "BOOLEAN",
        minVal: "",
        maxVal: "",
        order: 0,
        options: "",
        isRequired: false,
        useValueLimit: false,
        valueLimitCount: "",
        valueLimitHours: "",
        isActive: true
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null);

    // [NEW] State for Conditional Logic (Numeric)
    const [conditionalLogic, setConditionalLogic] = useState<{
        enabled: boolean;
        parentId: number | null;
        conditions: { [key: string]: { min: string; max: string } };
    }>({
        enabled: false,
        parentId: null,
        conditions: {}
    });
    const [parentOptions, setParentOptions] = useState<string[]>([]);

    // [NEW] State for Dropdown Options (Label + Spec)
    const [dropdownOptions, setDropdownOptions] = useState<{ label: string; spec: string }[]>([]);
    const [newOption, setNewOption] = useState({ label: "", spec: "" });

    // [NEW] State for Image Configuration
    const [imageConfig, setImageConfig] = useState<{ before: string[]; after: string[] }>({ before: [], after: [] });

    const [newImagePos, setNewImagePos] = useState({ type: 'before', label: '' });

    // [NEW] State for Sub-Items (Fixtures)
    const [subItems, setSubItems] = useState<string[]>([]);
    const [newSubItem, setNewSubItem] = useState("");

    // [NEW] DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (!loading && isAuthenticated) {
            fetchTypes();
        }
    }, [loading, isAuthenticated]);

    const fetchTypes = () => {
        if (loading || !isAuthenticated) return; // [NEW] Guard clause

        axios.get(`${config.apiServer}/api/preventive-types`)
            .then(res => setTypes(res.data))
            .catch(err => console.error(err));
    };

    const handleSubmitType = (e: React.FormEvent) => {
        e.preventDefault();

        Swal.fire({
            title: 'Confirm Save',
            text: "Do you want to save this preventive type?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, save it!'
        }).then((result) => {
            if (result.isConfirmed) {
                const apiCall = editingId
                    ? axios.put(`${config.apiServer}/api/preventive-types/${editingId}`, formData)
                    : axios.post(`${config.apiServer}/api/preventive-types`, formData);

                apiCall
                    .then(() => {
                        fetchTypes();
                        const closeBtn = document.getElementById("createTypeModal_btnClose");
                        if (closeBtn) closeBtn.click();
                        resetForm();
                        Swal.fire({
                            title: 'Saved!',
                            text: 'Preventive Type has been saved.',
                            icon: 'success',
                            timer: 300,
                            showConfirmButton: false
                        });
                    })
                    .catch(err => {
                        console.error(err);
                        Swal.fire('Error!', 'Failed to save preventive type.', 'error');
                    });
            }
        });
    };

    const handleEditType = (type: MachineType) => {
        setEditingId(type.id);
        setFormData({
            name: type.name,
            description: type.description,
            image: type.image || "",
            isFixedDate: type.isFixedDate !== undefined ? type.isFixedDate : true,
            postponeLogic: type.postponeLogic || "SHIFT",
            emailRecipients: (type as any).emailRecipients || "",
            notifyAdvanceDays: (type as any).notifyAdvanceDays !== undefined ? (type as any).notifyAdvanceDays : 3
        });
        const modalBtn = document.getElementById("openTypeModalBtn");
        if (modalBtn) modalBtn.click();
    };

    const resetForm = () => {
        setFormData({ name: "", description: "", image: "", isFixedDate: true, postponeLogic: "SHIFT", emailRecipients: "", notifyAdvanceDays: 3 });
        setEditingId(null);
    };

    const handleDeleteType = (id: number) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "This will delete the preventive type. If it's in use, deletion will be blocked.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`${config.apiServer}/api/preventive-types/${id}`)
                    .then(() => {
                        fetchTypes();
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Preventive Type has been deleted.',
                            icon: 'success',
                            timer: 300,
                            showConfirmButton: false
                        });
                    })
                    .catch(err => {
                        console.error(err);
                        // [NEW] Show specific error message from backend
                        Swal.fire('Error!', err.response?.data?.error || 'Failed to delete preventive type.', 'error');
                    });
            }
        });
    };

    const refreshChecklists = () => {
        fetchTypes();
        axios.get(`${config.apiServer}/api/preventive-types`)
            .then(res => {
                setTypes(res.data);
                const updated = res.data.find((t: MachineType) => t.id === selectedType!.id);
                if (updated) setSelectedType(updated);
            });
    };

    const handleAddChecklist = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedType) return;

        // Prepare payload
        const payload = { ...checklistData };


        // Handle Dropdown Options (wrap in object to support subItems)
        if (payload.type === 'DROPDOWN') {
            if (dropdownOptions.length > 0 || subItems.length > 0) {
                payload.options = JSON.stringify({
                    options: dropdownOptions,
                    ...(subItems.length > 0 && { subItems })
                });
            }
        }

        // Handle Numeric Conditional Logic
        if (payload.type === 'NUMERIC' && conditionalLogic.enabled && conditionalLogic.parentId) {
            const numericOptions: any = {
                parentId: conditionalLogic.parentId,
                conditions: conditionalLogic.conditions
            };
            if (subItems.length > 0) {
                numericOptions.subItems = subItems;
            }
            payload.options = JSON.stringify(numericOptions);
        }

        // Handle Image Configuration
        if (payload.type === 'IMAGE') {
            payload.options = JSON.stringify(imageConfig);
        }

        // Handle Sub-Items for BOOLEAN and TEXT types
        if (payload.type === 'BOOLEAN' || payload.type === 'TEXT') {
            if (subItems.length > 0) {
                payload.options = JSON.stringify({ subItems });
            }
        }

        if (editingChecklistId) {
            axios.put(`${config.apiServer}/api/preventive-types/checklists/${editingChecklistId}`, payload)
                .then(() => {
                    refreshChecklists();
                    resetChecklistForm();
                    setEditingChecklistId(null);
                })
                .catch(err => console.error(err));
        } else {
            axios.post(`${config.apiServer}/api/preventive-types/${selectedType.id}/checklists`, payload)
                .then(() => {
                    refreshChecklists();
                    resetChecklistForm();
                })
                .catch(err => console.error(err));
        }
    };

    const handleEditChecklist = (item: MasterChecklist) => {
        setChecklistData({
            topic: item.topic,
            type: item.type,
            minVal: item.minVal?.toString() || "",
            maxVal: item.maxVal?.toString() || "",
            order: item.order,
            options: item.options || "",
            isRequired: !!item.isRequired,
            useValueLimit: !!item.useValueLimit,
            valueLimitCount: item.valueLimitCount?.toString() || "",
            valueLimitHours: item.valueLimitHours?.toString() || "",
            isActive: item.isActive !== undefined ? item.isActive : true
        });
        setEditingChecklistId(item.id);

        // Parse Options for Dropdown
        if (item.type === 'DROPDOWN' && item.options) {
            try {
                const parsed = JSON.parse(item.options);
                if (Array.isArray(parsed)) {
                    // Legacy format: [{label, spec}] array directly
                    setDropdownOptions(parsed);
                } else if (parsed.options && Array.isArray(parsed.options)) {
                    // New format: { options: [{label, spec}], subItems?: [...] }
                    setDropdownOptions(parsed.options);
                } else {
                    setDropdownOptions([]);
                }
            } catch {
                // Legacy CSV string
                const opts = item.options.split(',').map(s => ({ label: s.trim(), spec: "" }));
                setDropdownOptions(opts);
            }
        } else {
            setDropdownOptions([]);
        }

        // Parse Options for Numeric (Conditional Logic)
        if (item.type === 'NUMERIC' && item.options) {
            try {
                const parsed = JSON.parse(item.options);
                if (parsed.parentId && parsed.conditions) {
                    setConditionalLogic({
                        enabled: true,
                        parentId: parsed.parentId,
                        conditions: parsed.conditions
                    });
                    // Fetch parent options to populate table
                    handleParentChange(parsed.parentId, true);
                }
            } catch {
                // Not JSON or legacy
                setConditionalLogic({ enabled: false, parentId: null, conditions: {} });
            }
        } else {
            setConditionalLogic({ enabled: false, parentId: null, conditions: {} });
        }

        // Parse Options for Image Config
        if (item.type === 'IMAGE' && item.options) {
            try {
                const parsed = JSON.parse(item.options);
                if (parsed.before || parsed.after) {
                    setImageConfig({
                        before: Array.isArray(parsed.before) ? parsed.before : [],
                        after: Array.isArray(parsed.after) ? parsed.after : []
                    });
                } else {
                    setImageConfig({ before: [], after: [] });
                }
            } catch {
                setImageConfig({ before: [], after: [] });
            }
        } else {
            setImageConfig({ before: [], after: [] });
        }

        // [NEW] Parse Options for Sub-Items (Fixtures)
        if (item.options) {
            try {
                const parsed = JSON.parse(item.options);
                if (parsed.subItems && Array.isArray(parsed.subItems)) {
                    setSubItems(parsed.subItems);
                } else {
                    setSubItems([]);
                }
            } catch {
                setSubItems([]);
            }
        } else {
            setSubItems([]);
        }
    };

    const resetChecklistForm = () => {
        setChecklistData({
            topic: "",
            type: "BOOLEAN",
            minVal: "",
            maxVal: "",
            order: 0,
            options: "",
            isRequired: false,
            useValueLimit: false,
            valueLimitCount: "",
            valueLimitHours: "",
            isActive: true
        });
        setConditionalLogic({ enabled: false, parentId: null, conditions: {} });
        setParentOptions([]);
        setDropdownOptions([]);
        setDropdownOptions([]);
        setNewOption({ label: "", spec: "" });
        setImageConfig({ before: [], after: [] });
        setNewImagePos({ type: 'before', label: '' });
        setSubItems([]); // [NEW] Reset Sub-Items
        setNewSubItem(""); // [NEW] Reset new sub-item input
    };

    // [NEW] Handlers for Dynamic Logic
    const handleParentChange = (parentId: number, skipResetConditions = false) => {
        if (!parentId) {
            setConditionalLogic(prev => ({ ...prev, parentId: null, conditions: {} }));
            setParentOptions([]);
            return;
        }

        const parent = selectedType?.masterChecklists?.find(c => c.id === parentId);
        if (parent) {
            let opts: string[] = [];
            try {
                const parsed = JSON.parse(parent.options || "[]");
                if (Array.isArray(parsed)) {
                    opts = parsed.map((o: any) => o.label || o); // Handle both {label, spec} and legacy strings
                }
            } catch {
                opts = (parent.options || "").split(',').map(s => s.trim());
            }

            setParentOptions(opts);
            setConditionalLogic(prev => ({
                ...prev,
                parentId,
                conditions: skipResetConditions ? prev.conditions : {}
            }));
        }
    };

    const handleConditionChange = (option: string, field: 'min' | 'max', value: string) => {
        setConditionalLogic(prev => ({
            ...prev,
            conditions: {
                ...prev.conditions,
                [option]: {
                    ...prev.conditions[option],
                    [field]: value
                }
            }
        }));
    };

    // [NEW] Handlers for Dropdown Options
    const addDropdownOption = () => {
        if (newOption.label.trim()) {
            setDropdownOptions([...dropdownOptions, { ...newOption }]);
            setNewOption({ label: "", spec: "" });
        }
    };

    const removeDropdownOption = (index: number) => {
        const newOpts = [...dropdownOptions];
        newOpts.splice(index, 1);
        setDropdownOptions(newOpts);
    };

    // [NEW] Handlers for Image Config
    const addImagePos = (type: 'before' | 'after') => {
        if (newImagePos.label.trim() && newImagePos.type === type) {
            setImageConfig(prev => ({
                ...prev,
                [type]: [...prev[type], newImagePos.label.trim()]
            }));
            setNewImagePos(prev => ({ ...prev, label: '' }));
        }
    };

    const removeImagePos = (type: 'before' | 'after', index: number) => {
        setImageConfig(prev => {
            const newArr = [...prev[type]];
            newArr.splice(index, 1);
            return { ...prev, [type]: newArr };
        });
    };

    const cancelEditChecklist = () => {
        resetChecklistForm();
        setEditingChecklistId(null);
    };

    const handleDeleteChecklist = (itemId: number) => {
        if (!selectedType) return;

        Swal.fire({
            title: 'Are you sure?',
            text: "Do you want to delete this checklist item?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`${config.apiServer}/api/preventive-types/checklists/${itemId}`)
                    .then((res) => {
                        refreshChecklists();
                        // [NEW] Handle Soft Delete Message
                        if (res.data.softDelete) {
                            Swal.fire('Deactivated', res.data.message, 'info');
                        } else {
                            Swal.fire({
                                title: 'Deleted!',
                                text: 'Checklist item has been deleted.',
                                icon: 'success',
                                timer: 300,
                                showConfirmButton: false
                            });
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        Swal.fire('Error!', 'Failed to delete checklist item.', 'error');
                    });
            }
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const uploadData = new FormData();
            uploadData.append('image', file);

            axios.post(`${config.apiServer}/api/upload`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
                .then(res => {
                    setFormData({ ...formData, image: res.data.path });
                })
                .catch(err => console.error(err));
        }
    };

    const openManageModal = (type: MachineType) => {
        setSelectedType(type);
        setEditingChecklistId(null);
        resetChecklistForm();
        resetChecklistForm();
    };

    // [NEW] Handle Drag End
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id && selectedType && selectedType.masterChecklists) {
            const oldIndex = selectedType.masterChecklists.findIndex((item) => item.id === active.id);
            const newIndex = selectedType.masterChecklists.findIndex((item) => item.id === over?.id);

            const newChecklists = arrayMove(selectedType.masterChecklists, oldIndex, newIndex);

            // Update local state immediately for UI responsiveness
            const updatedType = { ...selectedType, masterChecklists: newChecklists };
            setSelectedType(updatedType);

            // Update types list as well to reflect changes in the card view if necessary
            setTypes(prevTypes => prevTypes.map(t => t.id === updatedType.id ? updatedType : t));

            // Prepare payload for backend
            const reorderedItems = newChecklists.map((item, index) => ({
                id: item.id,
                order: index + 1 // 1-based order
            }));

            // Send to backend
            axios.put(`${config.apiServer}/api/preventive-types/checklists/reorder`, { items: reorderedItems })
                .then(() => {
                    // Optional: Show toast or just silent success
                    console.log('Order updated');
                })
                .catch(err => {
                    console.error('Failed to reorder', err);
                    Swal.fire('Error', 'Failed to save new order', 'error');
                    refreshChecklists(); // Revert on error
                });
        }
    };

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Hidden button to trigger modal without resetting form */}
            <button id="openTypeModalBtn" className="d-none" data-bs-toggle="modal" data-bs-target="#createTypeModal"></button>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">PM Schedule Master</h2>
                    <p className="text-muted mb-0">Define preventive maintenance schedules and checklists</p>
                </div>
                <MachineSettingsNav>
                    <button className="btn btn-primary shadow-sm" onClick={resetForm} data-bs-toggle="modal" data-bs-target="#createTypeModal">
                        <i className="bi bi-plus-lg me-2"></i>New Type
                    </button>
                </MachineSettingsNav>
            </div>

            <div className="row g-4">
                {types.map((type) => (
                    <div className="col-md-4 col-lg-3" key={type.id}>
                        <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
                            <div className="card-img-top text-center bg-white p-4 border-bottom" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {type.image ? (
                                    <img
                                        src={`${config.apiServer}${type.image}`}
                                        alt={type.name}
                                        className="img-fluid rounded"
                                        style={{ maxHeight: '100%', objectFit: 'contain' }}
                                        onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.onerror = null; // ป้องกัน loop
                                            img.src = 'https://via.placeholder.com/150?text=No+Image';
                                        }}
                                    />
                                ) : (
                                    <div className="text-muted text-center">
                                        <i className="bi bi-image display-4 opacity-25"></i>
                                        <p className="small mt-2 mb-0">No Image</p>
                                    </div>
                                )}
                            </div>
                            <div className="card-body d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h5 className="card-title fw-bold text-dark mb-0">{type.name}</h5>
                                    {/* [NEW] Badge for Scheduling Mode */}
                                    {type.isFixedDate === false ? (
                                        <span className="badge bg-info text-dark" title="Floating Date: Based on completion">Floating</span>
                                    ) : (
                                        <span className="badge bg-primary" title="Fixed Date: Strict schedule">Fixed</span>
                                    )}
                                </div>
                                <p className="card-text text-muted small mb-3 flex-grow-1">{type.description || "No description provided."}</p>
                                <div className="mb-3">
                                    <span className="badge bg-info bg-opacity-10 text-info border border-info rounded-pill px-3 fw-normal">
                                        <i className="bi bi-list-check me-1"></i>
                                        {type.masterChecklists?.length || 0} Checklists
                                    </span>
                                </div>
                                <div className="d-grid gap-2">
                                    <button className="btn btn-outline-primary btn-sm" data-bs-toggle="modal" data-bs-target="#manageChecklistsModal" onClick={() => openManageModal(type)}>
                                        <i className="bi bi-list-check me-1"></i> Manage Checklists
                                    </button>
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-outline-primary btn-sm flex-grow-1" onClick={() => handleEditType(type)}>
                                            <i className="bi bi-pencil-square me-1"></i> Edit
                                        </button>
                                        <button className="btn btn-outline-danger btn-sm flex-grow-1" onClick={() => handleDeleteType(type.id)}>
                                            <i className="bi bi-trash me-1"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {types.length === 0 && (
                    <div className="col-12 text-center py-5 text-muted">
                        <i className="bi bi-inbox display-1 opacity-25"></i>
                        <p className="mt-3 fs-5">No Preventive Types found.</p>
                        <button className="btn btn-primary mt-2" onClick={resetForm} data-bs-toggle="modal" data-bs-target="#createTypeModal">
                            Create Your First Type
                        </button>
                    </div>
                )}
            </div>

            {/* Create Type Modal */}
            <MyModal id="createTypeModal" title={editingId ? "Edit Preventive Type" : "Create Preventive Type"}>
                <form onSubmit={handleSubmitType}>
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Type Name</label>
                        <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Monthly Maintenance" />
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Description</label>
                        <textarea className="form-control" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description..." />
                    </div>

                    {/* [NEW] Scheduling Mode Selection */}
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted d-block">Scheduling Mode</label>
                        <div className="form-check form-check-inline">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="isFixedDate"
                                id="modeFixed"
                                checked={formData.isFixedDate === true}
                                onChange={() => setFormData({ ...formData, isFixedDate: true })}
                            />
                            <label className="form-check-label" htmlFor="modeFixed">
                                Fixed Date (Strict Schedule)
                                <div className="form-text small mt-0">Next date is calculated from the <strong>Planned Date</strong>.</div>
                            </label>
                        </div>
                        <div className="form-check form-check-inline mt-2">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="isFixedDate"
                                id="modeFloating"
                                checked={formData.isFixedDate === false}
                                onChange={() => setFormData({ ...formData, isFixedDate: false })}
                            />
                            <label className="form-check-label" htmlFor="modeFloating">
                                Floating Date (Based on Completion)
                                <div className="form-text small mt-0">Next date is calculated from the <strong>Actual Completion Date</strong>.</div>
                            </label>
                        </div>
                    </div>

                    {/* [NEW] Postpone Logic (Only for Fixed Date) */}
                    {formData.isFixedDate && (
                        <div className="mb-3 ps-4 border-start border-3 border-primary bg-light p-2 rounded">
                            <label className="form-label fw-bold small text-muted d-block">Postpone Logic (When Plan is Delayed)</label>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="postponeLogic"
                                    id="logicShift"
                                    checked={formData.postponeLogic === 'SHIFT'}
                                    onChange={() => setFormData({ ...formData, postponeLogic: 'SHIFT' })}
                                />
                                <label className="form-check-label" htmlFor="logicShift">
                                    Shift Schedule (Default)
                                    <div className="form-text small mt-0">Future dates will move relative to the postponed date. (e.g. Do late to Next one is late too)</div>
                                </label>
                            </div>
                            <div className="form-check mt-2">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="postponeLogic"
                                    id="logicMaintain"
                                    checked={formData.postponeLogic === 'MAINTAIN_CYCLE'}
                                    onChange={() => setFormData({ ...formData, postponeLogic: 'MAINTAIN_CYCLE' })}
                                />
                                <label className="form-check-label" htmlFor="logicMaintain">
                                    Maintain Cycle (Catch Up)
                                    <div className="form-text small mt-0">Future dates try to stick to the original cycle. (e.g. Do late to Next one is sooner to get back on track)</div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* [NEW] Email Notification Settings */}
                    <div className="mb-4 border-top pt-3">
                        <h6 className="fw-bold text-dark mb-3"><i className="bi bi-envelope-paper me-2"></i>Email Notifications</h6>
                        <div className="mb-3">
                            <label className="form-label fw-bold small text-muted">Recipients (Comma separated)</label>
                            <input type="text" className="form-control" value={formData.emailRecipients} onChange={e => setFormData({ ...formData, emailRecipients: e.target.value })} placeholder="e.g. manager@example.com, staff@example.com" />
                            <div className="form-text">Leave empty to disable email notifications for this type.</div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-bold small text-muted">Advance Notice (Days)</label>
                            <input type="number" className="form-control" value={formData.notifyAdvanceDays} onChange={e => setFormData({ ...formData, notifyAdvanceDays: parseInt(e.target.value) })} min="0" />
                            <div className="form-text small">จำนวนวันที่จะส่ง Email แจ้งเตือนล่วงหน้าก่อนถึงกำหนด PM (จัดการเวลาส่งผ่าน Windows Task Scheduler)</div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold small text-muted">Reference Diagram (Image)</label>
                        <input type="file" className="form-control" onChange={handleImageUpload} accept="image/*" />
                        {formData.image && <div className="mt-2"><small className="text-success"><i className="bi bi-check-circle me-1"></i>Image uploaded successfully</small></div>}
                    </div>
                    <div className="text-end pt-3 border-top">
                        <button type="button" id="createTypeModal_btnClose" className="btn btn-light border me-2" data-bs-dismiss="modal">
                            <i className="bi bi-x-lg me-2"></i>Close
                        </button>
                        <button type="submit" className="btn btn-primary px-4 shadow-sm">
                            <i className="bi bi-save me-2"></i>{editingId ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </MyModal>

            {/* Manage Checklists Modal */}
            <div className="modal fade" id="manageChecklistsModal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-light border-bottom-0">
                            <h5 className="modal-title fw-bold">Manage Checklists: <span className="text-primary">{selectedType?.name}</span></h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body p-4">
                            {/* Add New Checklist Form */}
                            <div className="card mb-4 border-0 bg-light rounded-3">
                                <div className="card-body">
                                    <h6 className="fw-bold mb-3 text-muted small text-uppercase">{editingChecklistId ? "Edit Item" : "Add New Item"}</h6>
                                    <form onSubmit={handleAddChecklist}>
                                        <div className="row g-2 align-items-end mb-2">
                                            <div className="col-md-3">
                                                <label className="form-label small text-muted mb-1">Topic</label>
                                                <input type="text" className="form-control" placeholder="e.g. Check Oil Level" value={checklistData.topic} onChange={e => setChecklistData({ ...checklistData, topic: e.target.value })} required />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label small text-muted mb-1">Input Type</label>
                                                <select className="form-select" value={checklistData.type} onChange={e => setChecklistData({ ...checklistData, type: e.target.value })}>
                                                    <option value="BOOLEAN">OK / NG</option>
                                                    <option value="NUMERIC">Numeric Value</option>
                                                    <option value="TEXT">Text Input</option>
                                                    <option value="DROPDOWN">Dropdown List</option>
                                                    <option value="IMAGE">Image (Before/After)</option>
                                                </select>
                                            </div>

                                            {checklistData.type === 'NUMERIC' && (
                                                <>
                                                    <div className="col-md-2">
                                                        <label className="form-label small text-muted mb-1">Min</label>
                                                        <input type="number" className="form-control" placeholder="0" value={checklistData.minVal} onChange={e => setChecklistData({ ...checklistData, minVal: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-2">
                                                        <label className="form-label small text-muted mb-1">Max</label>
                                                        <input type="number" className="form-control" placeholder="100" value={checklistData.maxVal} onChange={e => setChecklistData({ ...checklistData, maxVal: e.target.value })} />
                                                    </div>
                                                </>
                                            )}

                                            {checklistData.type === 'DROPDOWN' && (
                                                <div className="col-md-12">
                                                    <label className="form-label small text-muted mb-1">Options (Label & Spec)</label>
                                                    <div className="input-group mb-2">
                                                        <input type="text" className="form-control form-control-sm" placeholder="Label (e.g. Controller A)" value={newOption.label} onChange={e => setNewOption({ ...newOption, label: e.target.value })} />
                                                        <input type="text" className="form-control form-control-sm" placeholder="Spec (Optional, e.g. 2-200)" value={newOption.spec} onChange={e => setNewOption({ ...newOption, spec: e.target.value })} />
                                                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={addDropdownOption}>Add</button>
                                                    </div>
                                                    {dropdownOptions.length > 0 && (
                                                        <div className="table-responsive border rounded bg-white" style={{ maxHeight: '150px' }}>
                                                            <table className="table table-sm mb-0 small table-hover">
                                                                <thead className="table-light sticky-top">
                                                                    <tr>
                                                                        <th>Label</th>
                                                                        <th>Spec</th>
                                                                        <th style={{ width: '50px' }}></th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {dropdownOptions.map((opt, idx) => (
                                                                        <tr key={idx}>
                                                                            <td>{opt.label}</td>
                                                                            <td className="text-muted">{opt.spec || "-"}</td>
                                                                            <td className="text-end">
                                                                                <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeDropdownOption(idx)}>
                                                                                    <i className="bi bi-x-lg"></i>
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {checklistData.type === 'IMAGE' && (
                                                <div className="col-md-12">
                                                    <label className="form-label small text-muted mb-1">Image Positions Configuration</label>

                                                    {/* Before Images */}
                                                    <div className="mb-3 p-2 border rounded bg-white">
                                                        <label className="form-label small fw-bold text-primary">Before Images</label>
                                                        <div className="input-group mb-2">
                                                            <input type="text" className="form-control form-control-sm" placeholder="Position (e.g. Front)"
                                                                value={newImagePos.type === 'before' ? newImagePos.label : ''}
                                                                onChange={e => setNewImagePos({ type: 'before', label: e.target.value })}
                                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImagePos('before'); } }}
                                                            />
                                                            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => addImagePos('before')}>Add</button>
                                                        </div>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {imageConfig.before.map((pos, idx) => (
                                                                <span key={idx} className="badge bg-light text-dark border d-flex align-items-center">
                                                                    {pos}
                                                                    <i className="bi bi-x ms-2 cursor-pointer text-danger" onClick={() => removeImagePos('before', idx)} style={{ cursor: 'pointer' }}></i>
                                                                </span>
                                                            ))}
                                                            {imageConfig.before.length === 0 && <small className="text-muted fst-italic">No positions defined (Default: 1 generic)</small>}
                                                        </div>
                                                    </div>

                                                    {/* After Images */}
                                                    <div className="p-2 border rounded bg-white">
                                                        <label className="form-label small fw-bold text-primary">After Images</label>
                                                        <div className="input-group mb-2">
                                                            <input type="text" className="form-control form-control-sm" placeholder="Position (e.g. Overall)"
                                                                value={newImagePos.type === 'after' ? newImagePos.label : ''}
                                                                onChange={e => setNewImagePos({ type: 'after', label: e.target.value })}
                                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImagePos('after'); } }}
                                                            />
                                                            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => addImagePos('after')}>Add</button>
                                                        </div>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {imageConfig.after.map((pos, idx) => (
                                                                <span key={idx} className="badge bg-light text-dark border d-flex align-items-center">
                                                                    {pos}
                                                                    <i className="bi bi-x ms-2 cursor-pointer text-danger" onClick={() => removeImagePos('after', idx)} style={{ cursor: 'pointer' }}></i>
                                                                </span>
                                                            ))}
                                                            {imageConfig.after.length === 0 && <small className="text-muted fst-italic">No positions defined (Default: 1 generic)</small>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* [NEW] Sub-Items (Fixtures) Configuration - Available for all types */}
                                            <div className="col-md-12 mt-3">
                                                <div className="p-2 border rounded bg-light">
                                                    <label className="form-label small fw-bold text-info mb-2">
                                                        <i className="bi bi-layers me-1"></i>Sub-Items / Fixtures Configuration
                                                        <span className="fw-normal text-muted ms-2">(Optional: Define multiple inspection points)</span>
                                                    </label>
                                                    <div className="input-group mb-2">
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            placeholder="e.g. Fixture 1, Station A"
                                                            value={newSubItem}
                                                            onChange={e => setNewSubItem(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    if (newSubItem.trim()) {
                                                                        setSubItems([...subItems, newSubItem.trim()]);
                                                                        setNewSubItem("");
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-info btn-sm"
                                                            onClick={() => {
                                                                if (newSubItem.trim()) {
                                                                    setSubItems([...subItems, newSubItem.trim()]);
                                                                    setNewSubItem("");
                                                                }
                                                            }}
                                                        >
                                                            <i className="bi bi-plus-lg me-1"></i>Add
                                                        </button>
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {subItems.map((item, idx) => (
                                                            <span key={idx} className="badge bg-info bg-opacity-10 text-info border border-info d-flex align-items-center py-1 px-2">
                                                                {item}
                                                                <i
                                                                    className="bi bi-x ms-2 text-danger"
                                                                    onClick={() => setSubItems(subItems.filter((_, i) => i !== idx))}
                                                                    style={{ cursor: 'pointer' }}
                                                                ></i>
                                                            </span>
                                                        ))}
                                                        {subItems.length === 0 && <small className="text-muted fst-italic">No sub-items defined (Topic will be a single item)</small>}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                        <div className="row g-2 align-items-center">
                                            <div className="col-md-6">
                                                <div className="form-check">
                                                    <input className="form-check-input" type="checkbox" id="isRequiredCheck" checked={checklistData.isRequired} onChange={e => setChecklistData({ ...checklistData, isRequired: e.target.checked })} />
                                                    <label className="form-check-label small" htmlFor="isRequiredCheck">
                                                        Required Field (Mandatory)
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="col-md-12 mt-2 border-top pt-2">
                                                <div className="form-check mb-2">
                                                    <input className="form-check-input" type="checkbox" id="useValueLimitCheck" checked={checklistData.useValueLimit} onChange={e => setChecklistData({ ...checklistData, useValueLimit: e.target.checked })} />
                                                    <label className="form-check-label small fw-bold" htmlFor="useValueLimitCheck">
                                                        Enable Value Usage Limit (Rate Limiting)
                                                    </label>
                                                </div>
                                                {checklistData.useValueLimit && (
                                                    <div className="row g-2 ps-4">
                                                        <div className="col-md-4">
                                                            <label className="form-label small text-muted mb-1">Max Uses</label>
                                                            <input type="number" className="form-control form-control-sm" placeholder="e.g. 3" value={checklistData.valueLimitCount} onChange={e => setChecklistData({ ...checklistData, valueLimitCount: e.target.value })} required />
                                                        </div>
                                                        <div className="col-md-4">
                                                            <label className="form-label small text-muted mb-1">Time Window (Hours)</label>
                                                            <input type="number" className="form-control form-control-sm" placeholder="e.g. 48" value={checklistData.valueLimitHours} onChange={e => setChecklistData({ ...checklistData, valueLimitHours: e.target.value })} required />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Conditional Logic for Numeric Items */}
                                            {checklistData.type === 'NUMERIC' && (
                                                <div className="col-md-12 mt-2 border-top pt-2">
                                                    <div className="form-check mb-2">
                                                        <input className="form-check-input" type="checkbox" id="useConditionalLogic"
                                                            checked={!!conditionalLogic.enabled}
                                                            onChange={e => setConditionalLogic({ ...conditionalLogic, enabled: e.target.checked })}
                                                        />
                                                        <label className="form-check-label small fw-bold" htmlFor="useConditionalLogic">
                                                            Enable Conditional Logic (Dynamic Criteria)
                                                        </label>
                                                    </div>
                                                    {conditionalLogic.enabled && (
                                                        <div className="ps-4">
                                                            <div className="mb-2">
                                                                <label className="form-label small text-muted mb-1">Depends On (Parent Dropdown)</label>
                                                                <select className="form-select form-select-sm"
                                                                    value={conditionalLogic.parentId || ""}
                                                                    onChange={e => handleParentChange(parseInt(e.target.value))}
                                                                >
                                                                    <option value="">-- Select Parent Dropdown --</option>
                                                                    {selectedType?.masterChecklists?.filter(c => c.type === 'DROPDOWN' && c.id !== editingChecklistId).map(c => (
                                                                        <option key={c.id} value={c.id}>{c.topic}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            {conditionalLogic.parentId && (
                                                                <div className="table-responsive border rounded bg-white">
                                                                    <table className="table table-sm mb-0 small">
                                                                        <thead className="table-light">
                                                                            <tr>
                                                                                <th>Parent Option</th>
                                                                                <th style={{ width: '150px' }}>Min</th>
                                                                                <th style={{ width: '150px' }}>Max</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {parentOptions.map((opt, idx) => (
                                                                                <tr key={idx}>
                                                                                    <td className="align-middle">{opt}</td>
                                                                                    <td>
                                                                                        <input type="number" className="form-control form-control-sm"
                                                                                            value={conditionalLogic.conditions[opt]?.min || ""}
                                                                                            onChange={e => handleConditionChange(opt, 'min', e.target.value)}
                                                                                            placeholder="Min"
                                                                                        />
                                                                                    </td>
                                                                                    <td>
                                                                                        <input type="number" className="form-control form-control-sm"
                                                                                            value={conditionalLogic.conditions[opt]?.max || ""}
                                                                                            onChange={e => handleConditionChange(opt, 'max', e.target.value)}
                                                                                            placeholder="Max"
                                                                                        />
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="col-md-12 mt-2">
                                                <div className="form-check form-switch">
                                                    <input className="form-check-input" type="checkbox" id="isActiveCheck" checked={checklistData.isActive !== false} onChange={e => setChecklistData({ ...checklistData, isActive: e.target.checked })} />
                                                    <label className="form-check-label small fw-bold" htmlFor="isActiveCheck">
                                                        Active (Enable this checklist item)
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="col-md-2 ms-auto d-flex gap-2">
                                                {editingChecklistId && (
                                                    <button type="button" className="btn btn-secondary w-100 shadow-sm" onClick={cancelEditChecklist} title="Cancel">
                                                        Cancel
                                                    </button>
                                                )}
                                                <button type="submit" className={`btn ${editingChecklistId ? "btn-warning text-white" : "btn-success"} w-100 shadow-sm`} title={editingChecklistId ? "Update Item" : "Add Item"}>
                                                    {editingChecklistId ? <i className="bi bi-pencil me-1"></i> : <i className="bi bi-plus-lg me-1"></i>}
                                                    {editingChecklistId ? "Update" : "Add"}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Checklists Section (BOOLEAN, NUMERIC, IMAGE) */}
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="mb-4">
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-dark mb-3">
                                            <i className="bi bi-check2-square me-2 text-success"></i>Checklists (OK/NG, Numeric, Image)
                                        </h6>
                                        <div className="table-responsive rounded border">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="bg-success bg-opacity-10 text-secondary">
                                                    <tr>
                                                        <th style={{ width: '40px' }}></th>
                                                        <th className="ps-3 py-3">Topic</th>
                                                        <th className="py-3">Type</th>
                                                        <th className="py-3">Criteria</th>
                                                        <th className="py-3 text-center">Status</th>
                                                        <th className="py-3 text-end pe-3">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <SortableContext
                                                        items={selectedType?.masterChecklists?.filter(item => item.type === 'BOOLEAN' || item.type === 'NUMERIC' || item.type === 'IMAGE').map(c => c.id) || []}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {selectedType?.masterChecklists?.filter(item => item.type === 'BOOLEAN' || item.type === 'NUMERIC' || item.type === 'IMAGE').map(item => (
                                                            <SortableRow key={item.id} id={item.id}>
                                                                {(listeners) => (
                                                                    <>
                                                                        <td className="text-center text-muted" style={{ cursor: 'grab' }} {...listeners}>
                                                                            <i className="bi bi-grip-vertical"></i>
                                                                        </td>
                                                                        <td className="ps-3 fw-bold">{item.topic}</td>
                                                                        <td>
                                                                            <span className={`badge ${item.type === 'BOOLEAN' ? 'bg-success' :
                                                                                item.type === 'NUMERIC' ? 'bg-info' : 'bg-primary'
                                                                                } bg-opacity-10 ${item.type === 'BOOLEAN' ? 'text-success' :
                                                                                    item.type === 'NUMERIC' ? 'text-info' : 'text-primary'
                                                                                } border fw-normal`}>
                                                                                {item.type === 'BOOLEAN' ? 'OK/NG' : item.type === 'NUMERIC' ? 'Numeric' : 'Image'}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            {item.type === 'NUMERIC' && <span className="font-monospace small bg-light px-2 py-1 rounded border">{item.minVal} - {item.maxVal}</span>}
                                                                            {item.type === 'BOOLEAN' && <span className="text-muted">-</span>}
                                                                            {item.type === 'IMAGE' && <span className="small text-muted"><i className="bi bi-images me-1"></i>Before/After</span>}
                                                                        </td>
                                                                        <td className="text-center">
                                                                            {item.isActive !== false ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Inactive</span>}
                                                                        </td>
                                                                        <td className="text-end pe-3">
                                                                            <button className="btn btn-outline-warning btn-sm me-2" onClick={() => handleEditChecklist(item)} title="Edit Item">
                                                                                <i className="bi bi-pencil me-1"></i> Edit
                                                                            </button>
                                                                            <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteChecklist(item.id)} title="Delete Item">
                                                                                <i className="bi bi-trash me-1"></i> Delete
                                                                            </button>
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </SortableRow>
                                                        ))}
                                                    </SortableContext>
                                                    {(!selectedType?.masterChecklists || selectedType.masterChecklists.filter(item => item.type === 'BOOLEAN' || item.type === 'NUMERIC' || item.type === 'IMAGE').length === 0) && (
                                                        <tr><td colSpan={6} className="text-center py-4 text-muted">No checklist items defined yet.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* More Details Section (TEXT, DROPDOWN) */}
                                    <div>
                                        <h6 className="fw-bold text-dark mb-3">
                                            <i className="bi bi-card-text me-2 text-primary"></i>More Details (Text, Dropdown)
                                        </h6>
                                        <div className="table-responsive rounded border">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="bg-primary bg-opacity-10 text-secondary">
                                                    <tr>
                                                        <th style={{ width: '40px' }}></th>
                                                        <th className="ps-3 py-3">Topic</th>
                                                        <th className="py-3">Type</th>
                                                        <th className="py-3">Options</th>
                                                        <th className="py-3 text-center">Required</th>
                                                        <th className="py-3 text-center">Status</th>
                                                        <th className="py-3 text-end pe-3">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <SortableContext
                                                        items={selectedType?.masterChecklists?.filter(item => item.type === 'TEXT' || item.type === 'DROPDOWN').map(c => c.id) || []}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {selectedType?.masterChecklists?.filter(item => item.type === 'TEXT' || item.type === 'DROPDOWN').map(item => (
                                                            <SortableRow key={item.id} id={item.id}>
                                                                {(listeners) => (
                                                                    <>
                                                                        <td className="text-center text-muted" style={{ cursor: 'grab' }} {...listeners}>
                                                                            <i className="bi bi-grip-vertical"></i>
                                                                        </td>
                                                                        <td className="ps-3 fw-bold">{item.topic}</td>
                                                                        <td><span className={`badge ${item.type === 'TEXT' ? 'bg-warning' : 'bg-purple'} bg-opacity-10 ${item.type === 'TEXT' ? 'text-warning' : 'text-primary'} border fw-normal`}>{item.type === 'TEXT' ? 'Text Input' : 'Dropdown'}</span></td>
                                                                        <td>
                                                                            {item.type === 'DROPDOWN' && <small className="text-muted text-wrap">{item.options}</small>}
                                                                            {item.type === 'TEXT' && <span className="text-muted">-</span>}
                                                                        </td>
                                                                        <td className="text-center">
                                                                            {item.isRequired ? <i className="bi bi-check-circle-fill text-success"></i> : <span className="text-muted">-</span>}
                                                                        </td>
                                                                        <td className="text-center">
                                                                            {item.isActive !== false ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Inactive</span>}
                                                                        </td>
                                                                        <td className="text-end pe-3">
                                                                            <button className="btn btn-outline-warning btn-sm me-2" onClick={() => handleEditChecklist(item)} title="Edit Item">
                                                                                <i className="bi bi-pencil me-1"></i> Edit
                                                                            </button>
                                                                            <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteChecklist(item.id)} title="Delete Item">
                                                                                <i className="bi bi-trash me-1"></i> Delete
                                                                            </button>
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </SortableRow>
                                                        ))}
                                                    </SortableContext>
                                                    {(!selectedType?.masterChecklists || selectedType.masterChecklists.filter(item => item.type === 'TEXT' || item.type === 'DROPDOWN').length === 0) && (
                                                        <tr><td colSpan={7} className="text-center py-4 text-muted">No additional detail fields defined yet.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </DndContext>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
