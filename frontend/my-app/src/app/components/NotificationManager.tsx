"use client";
import { useEffect } from "react";
import axios from "axios";
import config from "../config";

const NotificationManager = () => {
  useEffect(() => {
    // Request permission on mount
    if (typeof Notification !== 'undefined' && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const checkNotifications = async () => {
      try {
        const res = await axios.get(`${config.apiServer}/api/dashboard/stats`);
        const data = res.data;

        // Check for overdue or upcoming machines
        if (!data || !data.machines) return;

        // Filter by preferences
        const savedPrefsRaw = localStorage.getItem('notification_prefs_v2');
        const prefs = savedPrefsRaw ? JSON.parse(savedPrefsRaw) : {};

        const alertMachines = data.machines.filter((m: any) => {
          const isUrgent = m.status === 'OVERDUE' || m.status === 'UPCOMING';
          if (!isUrgent) return false;

          // Check preference (default to true if not set)
          const pref = prefs[m.id];
          if (pref && pref.windows === false) {
            return false; // User explicitly disabled windows alert for this machine
          }
          return true; // Default enabled
        });

        if (alertMachines.length > 0) {
          // Play sound
          const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'); // Example sound
          audio.play().catch(e => console.log("Audio play failed", e));

          // Show notification
          if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
            new Notification("Machine PM Alert", {
              body: `${alertMachines.length} machines need attention!`,
              icon: "/favicon.ico"
            });
          }
        }
      } catch (error) {
        console.error("Notification check failed", error);
      }
    };

    // Check every 60 seconds
    // const interval = setInterval(checkNotifications, 60000);

    // Initial check
    // checkNotifications();

    // return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
};

export default NotificationManager;
