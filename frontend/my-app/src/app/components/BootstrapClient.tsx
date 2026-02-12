"use client";
import { useEffect } from "react";

export default function BootstrapClient() {
    useEffect(() => {
        // Dynamically import Bootstrap JS after hydration
        // This ensures Bootstrap is available for all data-bs-toggle elements
        // @ts-expect-error - Bootstrap JS types not needed, only importing for side effects
        import("bootstrap/dist/js/bootstrap.bundle.min.js");
    }, []);

    return null;
}
