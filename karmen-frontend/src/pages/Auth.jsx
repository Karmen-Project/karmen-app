import { useState } from "react";
import { MdReceiptLong, MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdSmartToy } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../utils/theme/ThemeContext.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function Auth() {
  const { T } = useTheme();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState("");
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMsg("Correo y contraseña son requeridos");
      return;
    }
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register({ name, nameCompany: company, username, email, password });
      setTab("login");
      setMsg("Registro exitoso. Inicia sesión.");
    } catch (err) {
      setMsg(err.message);
    }
  };

  const inp = {
    padding: "10px 12px",
    border: `1px solid ${T.border}`,
    borderRadius: T.radiusSm,
    fontSize: 14,
    background: T.surface,
    color: T.text,
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        transition: "background 0.2s",
        position: "relative",
      }}
    >
      {/* Botón volver — esquina superior izquierda */}
      <button
        onClick={() => navigate("/")}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = T.accentLt;
          e.currentTarget.style.color = T.accent;
          e.currentTarget.style.borderColor = T.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = T.white;
          e.currentTarget.style.color = T.sub;
          e.currentTarget.style.borderColor = T.border;
        }}
        style={{
          position: "fixed",
          top: 20,
          left: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 99,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: T.sub,
          boxShadow: T.shadow,
          transition: "all 0.2s",
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 15 }}>←</span> Volver al inicio
      </button>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: T.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            margin: "0 auto 12px",
          }}
        >
          <MdReceiptLong />
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: T.text }}>
          Karmen
        </h1>
        <p style={{ margin: "4px 0 0", color: T.sub, fontSize: 14 }}>
          Gestión Contable Automatizada
        </p>
      </div>

      <div
        style={{
          background: T.white,
          borderRadius: 16,
          boxShadow: T.shadowMd,
          padding: 32,
          width: "100%",
          maxWidth: 420,
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            fontSize: 20,
            fontWeight: 700,
            color: T.text,
          }}
        >
          Accede a tu cuenta
        </h2>

        <div
          style={{
            display: "flex",
            background: T.surface,
            borderRadius: T.radiusSm,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {["login", "register"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setMsg("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                borderRadius: 7,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                background: tab === t ? T.white : "transparent",
                color: tab === t ? T.text : T.sub,
                boxShadow: tab === t ? T.shadow : "none",
              }}
            >
              {t === "login" ? "Iniciar Sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        {msg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: T.radiusSm,
              background: msg.includes("exitoso") ? T.greenLt : T.redLt,
              color: msg.includes("exitoso") ? T.greenText : T.redText,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {msg}
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 6,
                  color: T.text,
                }}
              >
                <MdEmail style={{ verticalAlign: "middle", marginRight: 6 }} /> Correo electrónico
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
                style={inp}
                required
              />
            </div>
            <div style={{ marginBottom: 20, position: "relative" }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 6,
                  color: T.text,
                }}
              >
                <MdLock style={{ verticalAlign: "middle", marginRight: 6 }} /> Contraseña
              </label>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inp}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: 32,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                {showPass ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px",
                background: T.btn,
                color: "white",
                border: "none",
                borderRadius: T.radiusSm,
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
            <p
              style={{
                textAlign: "center",
                marginTop: 12,
                fontSize: 13,
                color: T.accent,
                cursor: "pointer",
              }}
            >
              ¿Olvidaste tu contraseña?
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            {[
              ["Nombre Completo", name, setName, "text"],
              ["Empresa", company, setCompany, "text"],
              ["Usuario (@)", username, setUsername, "text"],
              ["Correo", email, setEmail, "email"],
              ["Contraseña", password, setPassword, "password"],
            ].map(([lbl, val, setter, type]) => (
              <div key={lbl} style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    display: "block",
                    marginBottom: 5,
                    color: T.text,
                  }}
                >
                  {lbl}
                </label>
                <input
                  type={type}
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                  style={inp}
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px",
                background: T.btn,
                color: "white",
                border: "none",
                borderRadius: T.radiusSm,
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                marginTop: 4,
              }}
            >
              {loading ? "Registrando..." : "Crear Cuenta"}
            </button>
          </form>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          background: "#E0F2FE",
          border: "1px solid #7DD3FC",
          borderRadius: T.radiusSm,
          padding: "12px 20px",
          maxWidth: 420,
          width: "100%",
          fontSize: 13,
          color: "#0369A1",
        }}
      >
        <MdLock style={{ verticalAlign: "middle", marginRight: 6 }} /><strong>Acceso seguro:</strong> Ingresa con tus credenciales
        corporativas o solicita acceso a tu administrador.
      </div>

      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 24,
          color: T.sub,
          fontSize: 13,
        }}
      >
        <span><MdSmartToy style={{ verticalAlign: "middle", marginRight: 4 }} />OCR Automático</span>
        <span><MdLock style={{ verticalAlign: "middle", marginRight: 4 }} />100% Seguro</span>
        <span><MdEmail style={{ verticalAlign: "middle", marginRight: 4 }} />Reportes Email</span>
      </div>
    </div>
  );
}
