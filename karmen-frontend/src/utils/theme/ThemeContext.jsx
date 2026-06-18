import { createContext, useContext, useState } from 'react';
import { T as lightTheme, TD as darkTheme } from './index.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('karmen-dark') === 'true');

  const toggle = () => setDark(d => {
    const next = !d;
    localStorage.setItem('karmen-dark', String(next));
    return next;
  });

  const T = dark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ T, dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
