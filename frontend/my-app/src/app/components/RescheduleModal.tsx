"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";

interface PMPlan {
    preventiveTypeId: number;
    preventiveTypeName: string;
    status: string;
    daysUntil: number | null;
    nextPMDate: string | null;
}

interface RescheduleModalProps {
    show: boolean;
    onClose: () => void;
    machineId: number;
    machineName: string;
    allPlans?: PMPlan[]; // [NEW] List of all PM plans for this machine
    // Legacy props for backward compatibility
    preventiveTypeId?: number;
    preventiveTypeName?: string;
    currentDate?: string;
    onSuccess: () => void;
}

export default function RescheduleModal({
    show,
    onClose,
    machineId,
    machineName,
    allPlans,
    preventiveTypeId: legacyTypeId,
    preventiveTypeName: legacyTypeName,
    currentDate: legacyCurrentDate,
    onSuccess
}: RescheduleModalProps) {
    // Build plans array - use allPlans if provided, otherwise use legacy props
    const plans: PMPlan[] = allPlans || (legacyTypeId ? [{
        preventiveTypeId: legacyTypeId,
        preventiveTypeName: legacyTypeName || '-',
        status: 'UNKNOWN',
        daysUntil: null,
        nextPMDate: legacyCurrentDate || null
    }] : []);

    const [selectedTypeId, setSelectedTypeId] = useState<number>(plans[0]?.preventiveTypeId || 0);
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update selected type and date when plans change
    useEffect(() => {
        if (plans.length > 0 && show) {
            // Default to first critical plan (OVERDUE > UPCOMING > others)
            const criticalPlan = plans.find(p => p.status === 'OVERDUE')
                || plans.find(p => p.status === 'UPCOMING')
                || plans[0];
            setSelectedTypeId(criticalPlan.preventiveTypeId);
            if (criticalPlan.nextPMDate) {
                setNewDate(criticalPlan.nextPMDate.split('T')[0]);
            }
        }
    }, [show, allPlans]);

    // Get selected plan details
    const selectedPlan = plans.find(p => p.preventiveTypeId === selectedTypeId);

    // Handle type selection change
    const handleTypeChange = (typeId: number) => {
        setSelectedTypeId(typeId);
        const plan = plans.find(p => p.preventiveTypeId === typeId);
        if (plan?.nextPMDate) {
            setNewDate(plan.nextPMDate.split('T')[0]);
        }
    };

    const handleSubmit = async () => {
        if (!newDate) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณาเลือกวันที่',
                timer: 1500,
                showConfirmButton: false
            });
            return;
        }

        if (!selectedTypeId) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณาเลือกประเภท PM',
                timer: 1500,
                showConfirmButton: false
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await axios.post(`${config.apiServer}/api/pm/reschedule`, {
                machineId,
                preventiveTypeId: selectedTypeId,
                newDate
            });

            Swal.fire({
                icon: 'success',
                title: 'เลื่อนวัน PM สำเร็จ',
                timer: 1000,
                showConfirmButton: false
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Reschedule error:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.response?.data?.error || 'ไม่สามารถเลื่อนวันได้',
                timer: 2000,
                showConfirmButton: false
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!show) return null;

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OVERDUE': return 'danger';
            case 'UPCOMING': return 'warning';
            default: return 'info';
        }
    };

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="card shadow-lg border-0 rounded-3" style={{ width: '450px' }}>
                <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center py-3">
                    <h5 className="mb-0 fw-bold">
                        <i className="bi bi-calendar-event me-2"></i>
                        เลื่อนวัน PM
                    </h5>
                    <button type="button" className="btn-close" onClick={onClose}></button>
                </div>
                <div className="card-body p-4">
                    <div className="mb-3">
                        <label className="form-label text-muted small">เครื่อง</label>
                        <div className="fw-bold text-dark fs-5">{machineName}</div>
                    </div>

                    {/* PM Type Selection */}
                    <div className="mb-3">
                        <label className="form-label fw-bold">เลือกประเภท PM</label>
                        {plans.length > 1 ? (
                            <select
                                className="form-select"
                                value={selectedTypeId}
                                onChange={(e) => handleTypeChange(parseInt(e.target.value))}
                            >
                                {plans.map(plan => (
                                    <option key={plan.preventiveTypeId} value={plan.preventiveTypeId}>
                                        {plan.preventiveTypeName}
                                        {plan.status === 'OVERDUE' && ' (⚠️ เลยกำหนด)'}
                                        {plan.status === 'UPCOMING' && ' (⏰ ใกล้ถึง)'}
                                        {plan.nextPMDate && ` - ${plan.nextPMDate.split('T')[0]}`}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="badge bg-info text-dark fs-6 px-3 py-2">
                                {selectedPlan?.preventiveTypeName || '-'}
                            </div>
                        )}
                    </div>

                    {/* Current Date Info */}
                    {selectedPlan?.nextPMDate && (
                        <div className="mb-3">
                            <label className="form-label text-muted small">วันที่กำหนดปัจจุบัน</label>
                            <div className="d-flex align-items-center">
                                <span className={`badge bg-${getStatusColor(selectedPlan.status)} me-2`}>
                                    {selectedPlan.status === 'OVERDUE' ? 'เลยกำหนด' :
                                        selectedPlan.status === 'UPCOMING' ? 'ใกล้ถึง' : 'ปกติ'}
                                </span>
                                <span className="text-dark">{selectedPlan.nextPMDate.split('T')[0]}</span>
                                {selectedPlan.daysUntil !== null && (
                                    <span className="text-muted ms-2">
                                        ({selectedPlan.daysUntil < 0 ?
                                            `${Math.abs(selectedPlan.daysUntil)} วันที่แล้ว` :
                                            `อีก ${selectedPlan.daysUntil} วัน`})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label fw-bold">เลือกวันใหม่</label>
                        <input
                            type="date"
                            className="form-control form-control-lg"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>
                <div className="card-footer bg-light d-flex justify-content-end gap-2">
                    <button className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
                        ยกเลิก
                    </button>
                    <button className="btn btn-warning" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                กำลังบันทึก...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-lg me-2"></i>
                                ยืนยันเลื่อนวัน
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
