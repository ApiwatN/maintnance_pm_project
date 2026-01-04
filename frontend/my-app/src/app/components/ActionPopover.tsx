"use client";
import { useState, useRef, useEffect } from "react";

interface ActionPopoverProps {
    show: boolean;
    anchorRect: { top: number; left: number; width: number; height: number } | null;
    onClose: () => void;
    onInspect: () => void;
    onReschedule: () => void;
}

export default function ActionPopover({
    show,
    anchorRect,
    onClose,
    onInspect,
    onReschedule
}: ActionPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [show, onClose]);

    if (!show || !anchorRect) return null;

    // Calculate position
    const style: React.CSSProperties = {
        position: 'fixed',
        top: anchorRect.top + anchorRect.height + 8,
        left: anchorRect.left + (anchorRect.width / 2) - 100, // Center the popover
        zIndex: 1070,
        minWidth: '200px'
    };

    return (
        <div
            ref={popoverRef}
            className="card shadow-lg border-0 rounded-3"
            style={style}
        >
            <div className="card-body p-2">
                <div className="d-grid gap-1">
                    <button
                        className="btn btn-outline-primary btn-sm text-start"
                        onClick={() => {
                            onInspect();
                            onClose();
                        }}
                    >
                        <i className="bi bi-clipboard-check me-2"></i>
                        ทำ PM
                    </button>
                    <button
                        className="btn btn-outline-warning btn-sm text-start"
                        onClick={() => {
                            onReschedule();
                            onClose();
                        }}
                    >
                        <i className="bi bi-calendar-event me-2"></i>
                        เลื่อนวัน PM
                    </button>
                </div>
            </div>
        </div>
    );
}
