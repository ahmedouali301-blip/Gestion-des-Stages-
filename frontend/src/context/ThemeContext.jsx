import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [sidebarMini, setSidebarMini] = useState(() => {
    return localStorage.getItem("sidebarMini") === "true";
  });

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("sidebarMini", sidebarMini);
  }, [sidebarMini]);

  const toggleTheme = () => setIsDark((p) => !p);
  const toggleSidebar = () => setSidebarMini((p) => !p);

  return (
    <ThemeContext.Provider
      value={{ isDark, toggleTheme, sidebarMini, toggleSidebar }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
