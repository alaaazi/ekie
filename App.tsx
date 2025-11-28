import React, { useState, useEffect } from 'react';
import { ClientPortal } from './components/ClientPortal';
import { LawyerDashboard } from './components/LawyerDashboard';
import { ClientRequest, CaseStatus, UserRole } from './types';
import { v4 as uuidv4 } from 'uuid';
import { fetchCasesAPI, createCaseAPI, updateCaseAPI } from './services/api';

export default function App() {
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);

  // Mock Database State
  const [cases, setCases] = useState<ClientRequest[]>([]);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const data = await fetchCasesAPI();
      setCases(data);
    } catch (error) {
      console.error("Failed to load cases", error);
    }
  };

  const handleClientSubmit = async (newRequest: Omit<ClientRequest, 'id' | 'status' | 'submittedAt' | 'chatHistory'>) => {
    const requestWithMeta: ClientRequest = {
      ...newRequest,
      id: uuidv4(),
      status: CaseStatus.NEW,
      submittedAt: new Date(),
      chatHistory: [],
    };
    try {
      const savedCase = await createCaseAPI(requestWithMeta);
      setCases(prev => [savedCase, ...prev]);
    } catch (error) {
      console.error("Failed to create case", error);
    }
  };

  const handleUpdateCase = async (updatedCase: ClientRequest) => {
    try {
      const savedCase = await updateCaseAPI(updatedCase);
      setCases(prev => prev.map(c => c.id === savedCase.id ? savedCase : c));
    } catch (error) {
      console.error("Failed to update case", error);
    }
  };

  return (
    <>
      {/* Dev Switcher */}
      <div className="fixed bottom-4 left-4 z-50 bg-ekie-900 text-white p-1.5 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity flex gap-1 text-[10px] font-bold font-sans">
        <button
          onClick={() => setRole(UserRole.CLIENT)}
          className={`px-3 py-1.5 rounded-full transition-colors ${role === UserRole.CLIENT ? 'bg-ekie-500 text-white' : 'hover:bg-white/10 text-slate-300'}`}
        >
          Vue Client
        </button>
        <button
          onClick={() => setRole(UserRole.LAWYER)}
          className={`px-3 py-1.5 rounded-full transition-colors ${role === UserRole.LAWYER ? 'bg-ekie-500 text-white' : 'hover:bg-white/10 text-slate-300'}`}
        >
          Vue Avocat
        </button>
      </div>

      {role === UserRole.CLIENT ? (
        <ClientPortal onSubmit={handleClientSubmit} />
      ) : (
        <LawyerDashboard cases={cases} onUpdateCase={handleUpdateCase} />
      )}
    </>
  );
}