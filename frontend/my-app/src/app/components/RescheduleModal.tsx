"use client";
import { useState } from "react";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";

interface RescheduleModalProps {
    show: boolean;
    onClose: () => void;
    machineId: number;
    machineName: string;
    preventiveTypeId: number;
    preventiveTypeName: string;
    currentDate?: string;
    onSuccess: () => void;
}

export default function RescheduleModal({
    show,
    onClose,
    machineId,
    machineName,
    preventiveTypeId,
    preventiveTypeName,
    currentDate,
    onSuccess
}: RescheduleModalProps) {
    const [newDate, setNewDate] = useState(currentDate ? currentDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        setIsSubmitting(true);

        try {
            await axios.post(`${config.apiServer}/api/pm/reschedule`, {
                machineId,
                preventiveTypeId,
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

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="card shadow-lg border-0 rounded-3" style={{ width: '400px' }}>
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
                        <div className="fw-bold text-dark">{machineName}</div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label text-muted small">ประเภท PM</label>
                        <div className="badge bg-info text-dark">{preventiveTypeName}</div>
                    </div>
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
