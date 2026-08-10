import React, { createContext, useContext } from 'react';

const ThemeContext = createContext({
  theme: {
    background: '#05060F',
    primary: '#4FD8FF',
    accent: '#FF9A3C'
  }
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: { background: '#05060F', primary: '#4FD8FF', accent: '#FF9A3C' } }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
