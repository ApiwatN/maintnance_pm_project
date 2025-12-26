"use client";
import React from 'react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import { usePathname } from 'next/navigation';

const LayoutContent = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    return (
        <div className="d-flex flex-column min-vh-100">
            {!isLoginPage && <Navbar />}
            <div className="flex-grow-1 bg-light">
                {children}
            </div>
        </div>
    );
};

import { SocketProvider } from './SocketProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SocketProvider>
                <LayoutContent>{children}</LayoutContent>
            </SocketProvider>
        </AuthProvider>
    );
}
