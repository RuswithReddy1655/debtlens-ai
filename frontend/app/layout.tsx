import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { RepositoryProvider } from '../hooks/useRepositoryContext';
import { DemoBanner } from '../components/DemoBanner';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'DebtLens AI | Technical Debt Intelligence Platform',
  description:
    'Standardized enterprise technical debt quantification, financial modeling, and hotspot intelligence platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <RepositoryProvider>
          <DemoBanner />
          <React.Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
            <div className="flex flex-1 min-h-[calc(100vh-37px)]">
              <div className="hidden md:block">
                <Sidebar />
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <Navbar />
                <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
                  {children}
                </main>
              </div>
            </div>
          </React.Suspense>
        </RepositoryProvider>
      </body>
    </html>
  );
}
