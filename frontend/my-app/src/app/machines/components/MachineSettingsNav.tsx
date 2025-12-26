"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "../../../context/AuthContext";

export default function MachineSettingsNav({ children }: { children?: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();
    const isAdmin = user?.systemRole === 'ADMIN';

    const navItems = [
        { name: "Machine Settings", path: "/machines", icon: "bi-gear-fill", adminOnly: false },
        { name: "Area Master", path: "/machines/areas", icon: "bi-geo-alt", adminOnly: true },
        { name: "Machine Type Master", path: "/machines/machine-types", icon: "bi-gear", adminOnly: true },
        { name: "Machine Name Master", path: "/machines/master", icon: "bi-hdd-network", adminOnly: true },
        { name: "User Master", path: "/machines/users", icon: "bi-people", adminOnly: true },
        { name: "PM Schedule Master", path: "/machines/types", icon: "bi-calendar-check", adminOnly: true },
    ];

    const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <div className="d-flex gap-2 overflow-auto pb-2" style={{ whiteSpace: 'nowrap' }}>
            {visibleNavItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`btn shadow-sm border ${isActive ? 'btn-primary' : 'btn-light'}`}
                    >
                        <i className={`bi ${item.icon} me-2`}></i>
                        {item.name}
                    </Link>
                );
            })}
            {children}
        </div>
    );
}
