import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from './api/endPoints.js';
import { ThemeProvider } from './utils/theme/ThemeContext.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Facturas from './pages/Facturas.jsx';
import CargarFactura from './pages/CargarFactura.jsx';
import Contabilidad from './pages/Contabilidad.jsx';
import Reportes from './pages/Reportes.jsx';
import Configuraciones from './pages/Configuraciones.jsx';
import CuentasContables from './pages/CuentasContables.jsx';
import Proveedores from './pages/Proveedores.jsx';

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/auth" replace />;
}

function HomeRoute() {
  return getToken() ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/facturas"     element={<PrivateRoute><Facturas /></PrivateRoute>} />
          <Route path="/cargar"       element={<PrivateRoute><CargarFactura /></PrivateRoute>} />
          <Route path="/contabilidad" element={<PrivateRoute><Contabilidad /></PrivateRoute>} />
          <Route path="/reportes"         element={<PrivateRoute><Reportes /></PrivateRoute>} />
          <Route path="/configuraciones"  element={<PrivateRoute><Configuraciones /></PrivateRoute>} />
          <Route path="/cuentas"          element={<PrivateRoute><CuentasContables /></PrivateRoute>} />
          <Route path="/proveedores"      element={<PrivateRoute><Proveedores /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
