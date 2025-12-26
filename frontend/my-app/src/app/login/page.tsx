"use client";
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import config from '../config';
import Swal from 'sweetalert2';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${config.apiServer}/api/auth/login`, {
                username,
                password
            });
            login(res.data.token, res.data.user);
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            Toast.fire({
                icon: 'success',
                title: 'Signed in successfully'
            });
        } catch (err: any) {
            console.error(err);

            let errorMessage = 'Invalid credentials';
            let errorTitle = 'Login Failed';

            if (!err.response) {
                // Network Error / CORS / Certificate Issue
                errorTitle = 'Connection Error';
                errorMessage = 'Cannot connect to server. Please check if the backend is running and you have accepted the security certificate (https://localhost:5003).';
            } else if (err.response.data && err.response.data.error) {
                // Server responded with error
                errorMessage = err.response.data.error;
            }

            Swal.fire({
                icon: 'error',
                title: errorTitle,
                text: errorMessage,
                footer: !err.response ? '<a href="https://localhost:5003" target="_blank">Click here to accept certificate</a>' : undefined
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
            <div className="card border-0 shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
                <div className="card-body p-5">
                    <div className="text-center mb-4">
                        <i className="bi bi-person-circle fs-1 text-primary"></i>
                        <h3 className="fw-bold mt-2">Welcome Back</h3>
                        <p className="text-muted">Sign in to continue</p>
                    </div>
                    <form onSubmit={handleSubmit} autoComplete="off">
                        <div className="mb-3">
                            <label className="form-label fw-bold small text-muted">Username</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-person"></i></span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 ps-0"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted">Password</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock"></i></span>
                                <input
                                    type="password"
                                    className="form-control border-start-0 ps-0"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
