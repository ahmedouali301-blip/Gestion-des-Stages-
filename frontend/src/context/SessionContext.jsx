import React, { createContext, useContext, useState, useEffect } from 'react';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  // Par défaut, on prend l'année en cours
  const currentYear = new Date().getFullYear().toString();
  const [activeSession, setActiveSession] = useState(localStorage.getItem('activeSession') || currentYear);

  useEffect(() => {
    localStorage.setItem('activeSession', activeSession);
  }, [activeSession]);

  const changeSession = (year) => {
    setActiveSession(year);
  };

  return (
    <SessionContext.Provider value={{ activeSession, changeSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
