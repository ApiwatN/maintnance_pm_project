import axios from 'axios';
import config from '../config';

export interface NotificationItem {
    id: string; // Machine ID as string for uniqueness
    machineId: number;
    type: 'upcoming' | 'overdue';
    machineName: string;
    area: string;
    machineType: string;
    date: string;
    daysDiff: number;
    preventiveType?: string;
}

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const showSystemNotification = (title: string, body: string, onClose?: () => void): Notification | null => {
    console.log("showSystemNotification called", { title, body, permission: Notification.permission });
    if (Notification.permission === 'granted') {
        try {
            const n = new Notification(title, {
                body,
                icon: '/favicon.ico',
                requireInteraction: true,
                // [FIX] Use tag to replace existing notifications with the same tag
                // This prevents stacking multiple notifications
                tag: 'pm-maintenance-alert'
            });
            console.log("Notification instance created with tag 'pm-maintenance-alert'", n);

            n.onclick = () => {
                window.focus();
                n.close();
            };

            n.onclose = () => {
                console.log("Notification closed");
                if (onClose) onClose();
            };

            return n;
        } catch (e) {
            console.error("New Notification Error:", e);
            return null;
        }
    } else {
        console.warn("Permission not granted", Notification.permission);
        return null;
    }
};

export const fetchNotifications = async (): Promise<NotificationItem[]> => {
    try {
        // Fetch global machine status
        const res = await axios.get(`${config.apiServer}/api/pm/global-status`);
        const machines: any[] = res.data || [];

        const alerts: NotificationItem[] = [];

        machines.forEach(m => {
            if (m.status === 'OVERDUE' || m.status === 'UPCOMING') {
                alerts.push({
                    id: `alert-${m.id}`,
                    machineId: m.id,
                    type: m.status.toLowerCase() as 'upcoming' | 'overdue',
                    machineName: m.name,
                    area: m.area,
                    machineType: m.type,
                    date: m.nextPMDate,
                    daysDiff: m.daysUntil || 0,
                    preventiveType: m.preventiveType
                });
            }
        });

        // Sort: Overdue first, then by date ascending
        alerts.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'overdue' ? -1 : 1;
            return a.daysDiff - b.daysDiff;
        });

        return alerts;
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
    }
};
