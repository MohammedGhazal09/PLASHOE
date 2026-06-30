import { createContext, useContext } from 'react';

const AdminDemoModeContext = createContext(false);

export function AdminDemoModeProvider({ value = false, children }) {
  return (
    <AdminDemoModeContext.Provider value={Boolean(value)}>
      {children}
    </AdminDemoModeContext.Provider>
  );
}

export const useAdminDemoMode = () => useContext(AdminDemoModeContext);
