const isProd = process.env.NODE_ENV === 'production';

// Dynamic API URL detection
// Dynamic API URL detection
const getApiServer = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // User requested Frontend HTTPS -> Backend HTTP
        // So we always return HTTP for the backend
        return `https://${hostname}:5003`;
    }
    // Default fallback
    return "https://localhost:5003";
};

export default {
    apiServer: process.env.NEXT_PUBLIC_API_URL || getApiServer(),
    token: "asdfghjklghjklkjhgf",
};
