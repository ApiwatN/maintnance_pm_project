"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import config from '../config';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to Backend URL
        // config.apiServer usually includes /api suffix? or just base?
        // Let's assume config.apiServer is 'http://localhost:3001'
        // If config.apiServer has /api, we should strip it or use base.
        // Assuming config.apiServer is base URL based on usage: `${config.apiServer}/api/...`
        // So config.apiServer is 'http://localhost:3001'

        // Ensure we connect to the root, not /api
        const socketInstance = io(config.apiServer, {
            path: '/socket.io', // Default path
            transports: ['websocket'], // Force websocket
            reconnectionAttempts: 5,
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
