"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useRef } from "react";

const Navbar = () => {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isNavCollapsed, setIsNavCollapsed] = useState(true);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const navRef = useRef<HTMLElement>(null);

    const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);
    const closeNav = () => {
        setIsNavCollapsed(true);
        setOpenDropdown(null);
    };

    const toggleDropdown = (name: string) => {
        setOpenDropdown(prev => prev === name ? null : name);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setOpenDropdown(null);
    }, [pathname]);

    if (!user) return null;

    const isAdmin = user.systemRole === 'ADMIN';

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top" ref={navRef}>
            <div className="container-fluid">
                <Link href="/" className="navbar-brand d-flex align-items-center" onClick={closeNav}>
                    <i className="bi bi-tools fs-4 me-2"></i>
                    <span className="fw-bold">PM System</span>
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    aria-controls="navbarNav"
                    aria-expanded={!isNavCollapsed}
                    aria-label="Toggle navigation"
                    onClick={handleNavCollapse}
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="navbarNav">
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`} onClick={closeNav}>
                                <i className="bi bi-speedometer2 me-1"></i> Dashboard
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link href="/machines/overall" className={`nav-link ${pathname === "/machines/overall" ? "active" : ""}`} onClick={closeNav}>
                                <i className="bi bi-grid-3x3-gap me-1"></i> Overall Status
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link href="/calendar" className={`nav-link ${pathname.startsWith("/calendar") ? "active" : ""}`} onClick={closeNav}>
                                <i className="bi bi-calendar-date me-1"></i> Calendar
                            </Link>
                        </li>

                        <li className="nav-item">
                            <Link href="/machines" className={`nav-link ${pathname === "/machines" || (pathname.startsWith("/machines") && !pathname.startsWith("/machines/overall") && !pathname.startsWith("/machines/users")) ? "active" : ""}`} onClick={closeNav}>
                                <i className="bi bi-gear-wide-connected me-1"></i> Machine Settings
                            </Link>
                        </li>

                        {isAdmin && (
                            <>
                                <li className={`nav-item dropdown ${openDropdown === 'analysis' ? 'show' : ''}`}>
                                    <a
                                        className={`nav-link dropdown-toggle ${pathname.startsWith("/analysis") ? "active" : ""}`}
                                        href="#"
                                        role="button"
                                        aria-expanded={openDropdown === 'analysis'}
                                        onClick={(e) => { e.preventDefault(); toggleDropdown('analysis'); }}
                                    >
                                        <i className="bi bi-graph-up me-1"></i> Analysis
                                    </a>
                                    <ul className={`dropdown-menu dropdown-menu-dark ${openDropdown === 'analysis' ? 'show' : ''}`}>
                                        <li><Link href="/analysis/machine" className="dropdown-item" onClick={closeNav}>Machine Analysis</Link></li>
                                        <li><Link href="/analysis/operator" className="dropdown-item" onClick={closeNav}>Operator Analysis</Link></li>
                                    </ul>
                                </li>
                                <li className="nav-item">
                                    <Link href="/machines/users" className={`nav-link ${pathname === "/machines/users" ? "active" : ""}`} onClick={closeNav}>
                                        <i className="bi bi-people me-1"></i> User Management
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>

                    <div className="d-flex align-items-center">
                        <div className={`dropdown ${openDropdown === 'user' ? 'show' : ''}`}>
                            <a
                                href="#"
                                className="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
                                id="dropdownUser1"
                                aria-expanded={openDropdown === 'user'}
                                onClick={(e) => { e.preventDefault(); toggleDropdown('user'); }}
                            >
                                <div className="bg-primary rounded-circle d-flex justify-content-center align-items-center me-2" style={{ width: '32px', height: '32px' }}>
                                    <span className="fw-bold small">{user.username.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <div className="d-none d-lg-block">
                                    <div className="fw-bold small">{user.name}</div>
                                    <div className="text-white-50" style={{ fontSize: '0.7rem' }}>{user.systemRole}</div>
                                </div>
                            </a>
                            <ul className={`dropdown-menu dropdown-menu-dark dropdown-menu-end text-small shadow ${openDropdown === 'user' ? 'show' : ''}`} aria-labelledby="dropdownUser1">
                                <li><button className="dropdown-item" onClick={logout}>Sign out</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

