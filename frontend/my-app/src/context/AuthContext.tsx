"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import config from '../app/config';

interface User {
    id: number;
    username: string;
    name: string;
    systemRole: 'ADMIN' | 'USER';
    permissionType: 'PM_ONLY' | 'RESCHEDULE_ONLY' | 'PM_AND_RESCHEDULE';
    role: string;
    assignedMachines?: { id: number; name: string; code: string }[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: () => { },
    logout: () => { },
    isAuthenticated: false,
    loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Load token from localStorage
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            // Set default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

            // Verify token and get user data
            axios.get(`${config.apiServer}/api/auth/me`, {
                headers: { Authorization: `Bearer ${storedToken}` }
            })
                .then(res => {
                    setUser(res.data);
                })
                .catch(err => {
                    console.error("Token invalid or expired", err);
                    logout();
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        // Set default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        // Remove default header
        delete axios.defaults.headers.common['Authorization'];
        router.push('/login');
    };

    // Protect Routes
    useEffect(() => {
        if (!loading) {
            if (!user && pathname !== '/login') {
                router.push('/login');
            } else if (user && pathname === '/login') {
                router.push('/');
            }
        }
    }, [user, loading, pathname]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
