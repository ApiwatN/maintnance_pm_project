import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS
import "./globals.css";
import ClientLayout from "./components/ClientLayout";

export const metadata: Metadata = {
  title: "Machine PM System",
  description: "Preventive Maintenance System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/bootstrap-icons/font/bootstrap-icons.min.css" />
      </head>
      <body className="antialiased">
        <ClientLayout>
          {children}
        </ClientLayout>
        {/* Bootstrap JS Bundle with Popper */}
        <script src="/bootstrap/js/bootstrap.bundle.min.js" async></script>
      </body>
    </html>
  );
}
