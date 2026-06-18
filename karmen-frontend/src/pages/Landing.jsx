import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function injectStyles() {
  if (document.getElementById("lnd-kf")) return;
  const s = document.createElement("style");
  s.id = "lnd-kf";
  s.textContent = `
    html { scroll-behavior: smooth; }
    @keyframes lnd-float    { 0%,100%{ transform:translateY(0) }       50%{ transform:translateY(-14px) } }
    @keyframes lnd-floatAlt { 0%,100%{ transform:translateY(0) rotate(0deg) } 50%{ transform:translateY(-9px) rotate(2deg) } }
    @keyframes lnd-gradAnim { 0%,100%{ background-position:0% 50% }    50%{ background-position:100% 50% } }
    @keyframes lnd-fadeUp   { from{ opacity:0; transform:translateY(28px) } to{ opacity:1; transform:translateY(0) } }
    @keyframes lnd-blink    { 0%,100%{ opacity:1 } 50%{ opacity:0.35 } }
    @keyframes lnd-orb      { 0%,100%{ transform:scale(1) }            50%{ transform:scale(1.12) } }
    @keyframes lnd-spin     { from{ transform:rotate(0deg) }           to{ transform:rotate(360deg) } }

    .lnd-hero-text {
      background: linear-gradient(135deg,#A78BFA,#818CF8,#60A5FA,#A78BFA);
      background-size:200% 200%;
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      background-clip:text;
      animation: lnd-gradAnim 5s ease infinite;
    }
    .lnd-nav-lnk  { transition:color 0.2s !important; }
    .lnd-nav-lnk:hover { color:#818CF8 !important; }
    .lnd-btn-pri  { transition: transform 0.2s, box-shadow 0.2s !important; }
    .lnd-btn-pri:hover { transform:translateY(-2px) !important; box-shadow:0 10px 30px rgba(79,70,229,.45) !important; }
    .lnd-btn-out  { transition: background 0.2s, transform 0.2s !important; }
    .lnd-btn-out:hover { background:rgba(129,140,248,.12) !important; transform:translateY(-2px) !important; }
    .lnd-btn-inv  { transition: transform 0.2s, box-shadow 0.2s !important; }
    .lnd-btn-inv:hover { transform:translateY(-2px) !important; box-shadow:0 10px 30px rgba(0,0,0,.2) !important; }
    .lnd-card     { transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s !important; }
    .lnd-card:hover { transform:translateY(-6px) !important; }
    .lnd-step-num { transition: transform 0.2s !important; }
    .lnd-step:hover .lnd-step-num { transform:scale(1.12) !important; }
    .lnd-glass {
      background:rgba(255,255,255,.04);
      border:1px solid rgba(255,255,255,.09);
      backdrop-filter:blur(14px);
      -webkit-backdrop-filter:blur(14px);
    }
    .lnd-mesh {
      background-image:
        radial-gradient(ellipse at 18% 50%,rgba(124,58,237,.18) 0%,transparent 60%),
        radial-gradient(ellipse at 80% 18%,rgba(79,70,229,.14) 0%,transparent 52%),
        radial-gradient(ellipse at 50% 85%,rgba(37,99,235,.12) 0%,transparent 50%);
    }
    .lnd-grid-overlay {
      background-image:
        linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
        linear-gradient(90deg,rgba(255,255,255,.035) 1px, transparent 1px);
      background-size:52px 52px;
    }
    .lnd-footer-lnk { cursor:pointer; transition:color 0.2s !important; }
    .lnd-footer-lnk:hover { color:#818CF8 !important; }

    @media (max-width: 768px) {
      .lnd-hero-text { background-size: 300% 300%; }
      .lnd-card:hover { transform: translateY(-3px) !important; }
    }
  `;
  document.head.appendChild(s);
}

/* ── Dashboard mockup ─────────────────────────────────────── */
function DashboardMock() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        background: "#1E293B",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow:
          "0 32px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06)",
        width: "100%",
        maxWidth: isMobile ? 320 : 490,
        animation: "lnd-float 7s ease-in-out infinite",
      }}
    >
      {/* browser bar */}
      <div
        style={{
          padding: "10px 18px",
          background: "#162032",
          borderBottom: "1px solid rgba(255,255,255,.06)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {["#F87171", "#FB923C", "#4ADE80"].map((c, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: c,
            }}
          />
        ))}
        <div
          style={{
            marginLeft: 12,
            flex: 1,
            background: "rgba(255,255,255,.06)",
            borderRadius: 6,
            padding: "3px 12px",
            fontSize: isMobile ? 9 : 11,
            color: "rgba(255,255,255,.35)",
            fontFamily: "Inter,sans-serif",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          app.karmen.co/dashboard
        </div>
      </div>

      {/* body */}
      <div style={{ display: "flex", height: isMobile ? 200 : 290 }}>
        {/* sidebar */}
        {!isMobile && (
          <div
            style={{
              width: 54,
              background: "#0F172A",
              padding: "16px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              borderRight: "1px solid rgba(255,255,255,.06)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg,#7C3AED,#4F46E5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 800,
                color: "#fff",
                fontFamily: "Inter,sans-serif",
              }}
            >
              K
            </div>
            {[1, 0, 0, 0, 0].map((a, i) => (
              <div
                key={i}
                style={{
                  width: 26,
                  height: 5,
                  borderRadius: 3,
                  background: a ? "#818CF8" : "rgba(255,255,255,.1)",
                }}
              />
            ))}
          </div>
        )}

        {/* main */}
        <div
          style={{
            flex: 1,
            padding: isMobile ? "12px 12px" : "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 8 : 12,
          }}
        >
          {/* KPIs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
              gap: isMobile ? 6 : 9,
            }}
          >
            {[
              { l: "Facturas", v: "124", c: "#818CF8", bg: "#1E1B4B" },
              { l: "Procesadas", v: "98%", c: "#4ADE80", bg: "#052E16" },
              { l: "Total", v: "$12.4M", c: "#A78BFA", bg: "#2E1065" },
            ].map((k, i) => (
              <div
                key={i}
                style={{
                  background: k.bg,
                  borderRadius: 9,
                  padding: isMobile ? "6px 8px" : "9px 11px",
                }}
              >
                <div
                  style={{
                    fontSize: isMobile ? 8 : 9,
                    color: "#94A3B8",
                    marginBottom: 2,
                    fontFamily: "Inter,sans-serif",
                  }}
                >
                  {k.l}
                </div>
                <div
                  style={{
                    fontSize: isMobile ? 14 : 16,
                    fontWeight: 700,
                    color: k.c,
                    fontFamily: "Inter,sans-serif",
                  }}
                >
                  {k.v}
                </div>
              </div>
            ))}
          </div>

          {/* chart */}
          <div
            style={{
              background: "#162032",
              borderRadius: 9,
              padding: isMobile ? "8px" : "10px",
              display: "flex",
              alignItems: "flex-end",
              gap: isMobile ? 3 : 5,
              height: isMobile ? 60 : 88,
            }}
          >
            {[32, 58, 44, 72, 50, 94, 66, 82, 48, 76].map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  borderRadius: "3px 3px 0 0",
                  background:
                    i === 5 || i === 7
                      ? "linear-gradient(to top,#7C3AED,#818CF8)"
                      : "rgba(129,140,248,.18)",
                }}
              />
            ))}
          </div>

          {/* rows */}
          {!isMobile && (
            <>
              {[
                {
                  n: "Factura #1042 – Tech Corp",
                  s: "Contabilizada",
                  c: "#4ADE80",
                },
                {
                  n: "Factura #1041 – Proveedor X",
                  s: "Procesada",
                  c: "#818CF8",
                },
                {
                  n: "Factura #1040 – Servicios SA",
                  s: "Pendiente",
                  c: "#FB923C",
                },
              ].map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "5px 9px",
                    background: "#162032",
                    borderRadius: 7,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#F1F5F9",
                      fontFamily: "Inter,sans-serif",
                    }}
                  >
                    {r.n}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: r.c,
                      fontFamily: "Inter,sans-serif",
                      background: `${r.c}18`,
                      padding: "2px 7px",
                      borderRadius: 4,
                    }}
                  >
                    {r.s}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredFeat, setHoveredFeat] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    injectStyles();
    const h = () => setScrolled(window.scrollY > 48);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("scroll", h);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", h);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  /* ── data ── */
  const features = [
    {
      icon: "🔍",
      title: "OCR Avanzado",
      color: "#4F46E5",
      bg: "rgba(79,70,229,.08)",
      desc: "Extrae NIT, fechas, valores e ítems de cualquier factura en segundos, sin importar el formato.",
    },
    {
      icon: "📄",
      title: "Multi-formato",
      color: "#2563EB",
      bg: "rgba(37,99,235,.08)",
      desc: "Soporta PDF, JPG y PNG. Sin restricciones de calidad, tamaño ni diseño de la factura.",
    },
    {
      icon: "📊",
      title: "Plan de Cuentas",
      color: "#16A34A",
      bg: "rgba(22,163,74,.08)",
      desc: "Contabilización automática según tu plan de cuentas personalizado. Cero errores de digitación.",
    },
    {
      icon: "📈",
      title: "Reportes y Exportación",
      color: "#F59E0B",
      bg: "rgba(245,158,11,.08)",
      desc: "Genera reportes detallados en Excel y PDF con un clic. Listos para auditorías y declaraciones.",
    },
    {
      icon: "⚡",
      title: "Procesamiento Rápido",
      color: "#EC4899",
      bg: "rgba(236,72,153,.08)",
      desc: "Procesa múltiples facturas en segundos. Optimizado para máximo rendimiento.",
    },
    {
      icon: "🔒",
      title: "Seguridad Empresarial",
      color: "#EF4444",
      bg: "rgba(239,68,68,.08)",
      desc: "Datos cifrados en tránsito y en reposo. Cumplimiento con normativas locales e internacionales.",
    },
  ];

  const steps = [
    {
      n: "01",
      icon: "⬆️",
      title: "Sube tu factura",
      desc: "Arrastra y suelta o selecciona tu factura en PDF, JPG o PNG desde cualquier dispositivo.",
    },
    {
      n: "02",
      icon: "✨",
      title: "Extracción automática",
      desc: "Nuestro motor OCR extrae todos los campos en segundos: proveedor, fecha, totales e impuestos.",
    },
    {
      n: "03",
      icon: "✅",
      title: "Gestión contable lista",
      desc: "Revisa, aprueba y contabiliza con un clic. El registro queda listo para reportes al instante.",
    },
  ];

  /* ── nav ── */
  const navLinks = [
    { label: "Características", id: "features" },
    { label: "Cómo funciona", id: "how" },
    { label: "Beneficios", id: "benefits" },
  ];

  const baseFont = { fontFamily: "Inter,sans-serif" };
  const GRAD = "linear-gradient(135deg,#7C3AED,#4F46E5)";

  return (
    <div style={{ ...baseFont, overflowX: "hidden", background: "#fff" }}>
      {/* ══════════════════════════════════════════════════
          NAV
      ════════════════════════════════════════════════════ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          height: 64,
          padding: isMobile ? "0 20px" : "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled ? "rgba(10,15,30,.88)" : "transparent",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,.07)" : "none",
          backdropFilter: scrolled ? "blur(18px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(18px)" : "none",
          transition:
            "background 0.35s, border-color 0.35s, backdrop-filter 0.35s",
        }}
      >
        {/* logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: GRAD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 800,
              color: "#fff",
              boxShadow: "0 4px 12px rgba(79,70,229,.45)",
            }}
          >
            K
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.3px",
            }}
          >
            Karmen
          </span>
        </div>

        {/* Desktop nav */}
        {!isMobile && (
          <>
            <div style={{ display: "flex", gap: 40 }}>
              {navLinks.map((lnk) => (
                <button
                  key={lnk.id}
                  className="lnd-nav-lnk"
                  onClick={() => scrollTo(lnk.id)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "rgba(255,255,255,.68)",
                  }}
                >
                  {lnk.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                className="lnd-btn-out"
                onClick={() => navigate("/auth")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,.22)",
                  color: "#fff",
                  borderRadius: 9,
                  padding: "8px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Iniciar sesión
              </button>
              <button
                className="lnd-btn-pri"
                onClick={() => navigate("/auth")}
                style={{
                  background: GRAD,
                  border: "none",
                  color: "#fff",
                  borderRadius: 9,
                  padding: "8px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Comenzar
              </button>
            </div>
          </>
        )}

        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 24,
              cursor: "pointer",
            }}
          >
            ☰
          </button>
        )}
      </nav>

      {/* Mobile menu */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: 0,
            right: 0,
            background: "rgba(10,15,30,.95)",
            backdropFilter: "blur(18px)",
            borderBottom: "1px solid rgba(255,255,255,.07)",
            zIndex: 199,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {navLinks.map((lnk) => (
            <button
              key={lnk.id}
              className="lnd-nav-lnk"
              onClick={() => scrollTo(lnk.id)}
              style={{
                background: "none",
                border: "none",
                padding: "10px 0",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 500,
                color: "rgba(255,255,255,.68)",
                textAlign: "left",
              }}
            >
              {lnk.label}
            </button>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            <button
              className="lnd-btn-out"
              onClick={() => {
                navigate("/auth");
                setMobileMenuOpen(false);
              }}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,.22)",
                color: "#fff",
                borderRadius: 9,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Iniciar sesión
            </button>
            <button
              className="lnd-btn-pri"
              onClick={() => {
                navigate("/auth");
                setMobileMenuOpen(false);
              }}
              style={{
                background: GRAD,
                border: "none",
                color: "#fff",
                borderRadius: 9,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Comenzar
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section
        className="lnd-mesh"
        style={{
          minHeight: "100vh",
          background: "#0A0F1E",
          position: "relative",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          paddingTop: isMobile ? 64 : 0,
        }}
      >
        {/* ambient orbs */}
        {[
          {
            top: "12%",
            left: "4%",
            w: 420,
            c: "rgba(124,58,237,.18)",
            d: "0s",
          },
          {
            top: "38%",
            right: "3%",
            w: 360,
            c: "rgba(79,70,229,.14)",
            d: "2s",
          },
          {
            bottom: "8%",
            left: "38%",
            w: 310,
            c: "rgba(37,99,235,.11)",
            d: "1s",
          },
        ].map((o, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: o.w,
              height: o.w,
              borderRadius: "50%",
              background: `radial-gradient(circle,${o.c} 0%,transparent 70%)`,
              top: o.top,
              left: o.left,
              right: o.right,
              bottom: o.bottom,
              animation: `lnd-orb ${8 + i * 2}s ease-in-out ${o.d} infinite`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* grid overlay */}
        <div
          className="lnd-grid-overlay"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        />

        {/* content */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: isMobile ? "40px 20px" : "100px 48px 72px",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? 40 : 72,
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* ── Left ── */}
          <div style={{ animation: "lnd-fadeUp 0.8s ease both" }}>
            {/* badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                background: "rgba(129,140,248,.1)",
                border: "1px solid rgba(129,140,248,.22)",
                borderRadius: 100,
                padding: "6px 18px",
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#4ADE80",
                  animation: "lnd-blink 2s ease-in-out infinite",
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 500, color: "#A5B4FC" }}>
                OCR
              </span>
            </div>

            {/* headline */}
            <h1
              style={{
                fontSize: isMobile ? "clamp(32px,7vw,45px)" : "clamp(38px,4.2vw,60px)",
                fontWeight: 800,
                lineHeight: 1.09,
                color: "#fff",
                margin: "0 0 24px",
                letterSpacing: "-1.5px",
              }}
            >
              Automatiza tu
              <br />
              <span className="lnd-hero-text">contabilidad</span>
              <br />
              de facturas
            </h1>

            {/* sub */}
            <p
              style={{
                fontSize: isMobile ? 15 : 17,
                lineHeight: 1.72,
                color: "rgba(255,255,255,.58)",
                margin: "0 0 40px",
                maxWidth: 490,
              }}
            >
              Karmen extrae automáticamente los datos de tus facturas con OCR
              y los registra en tu contabilidad. Diseñado para pequeñas empresas
              y trabajadores independientes que quieren ahorrar tiempo y eliminar errores.
            </p>

            {/* cta row */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button
                className="lnd-btn-pri"
                onClick={() => navigate("/auth")}
                style={{
                  background: GRAD,
                  border: "none",
                  color: "#fff",
                  borderRadius: 11,
                  padding: "15px 30px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  flex: isMobile ? "1 1 auto" : "0 0 auto",
                  minWidth: isMobile ? "auto" : 0,
                }}
              >
                Comenzar
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                className="lnd-btn-out"
                onClick={() => scrollTo("how")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,.2)",
                  color: "#fff",
                  borderRadius: 11,
                  padding: "15px 30px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  flex: isMobile ? "1 1 auto" : "0 0 auto",
                  minWidth: isMobile ? "auto" : 0,
                }}
              >
                Ver cómo funciona
              </button>
            </div>
          </div>

          {/* ── Right ── */}
          {!isMobile && (
            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                animation: "lnd-fadeUp 0.8s 0.18s ease both",
              }}
            >
              <DashboardMock />

              {/* floating badges */}
              {[
                {
                  top: -22,
                  left: -14,
                  icon: "🔍",
                  iconBg: "linear-gradient(135deg,#7C3AED,#4F46E5)",
                  title: "OCR Completado",
                  sub: "12 campos extraídos",
                  anim: "lnd-floatAlt 5.5s ease-in-out infinite",
                },
                {
                  bottom: 24,
                  right: -22,
                  icon: "✅",
                  iconBg: "linear-gradient(135deg,#15803D,#4ADE80)",
                  title: "Contabilizado",
                  sub: "Precisión 98%",
                  anim: "lnd-floatAlt 6.5s ease-in-out 1.6s infinite",
                },
              ].map((b, i) => (
                <div
                  key={i}
                  className="lnd-glass"
                  style={{
                    position: "absolute",
                    top: b.top,
                    left: b.left,
                    right: b.right,
                    bottom: b.bottom,
                    padding: "10px 16px",
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    animation: b.anim,
                    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      flexShrink: 0,
                      background: b.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                    }}
                  >
                    {b.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                      {b.title}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.48)" }}>
                      {b.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile dashboard mockup */}
        {isMobile && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              paddingBottom: 20,
            }}
          >
            <DashboardMock />
          </div>
        )}

        {/* bottom fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
            background: "linear-gradient(transparent,#fff)",
            pointerEvents: "none",
          }}
        />
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════ */}
      <section
        id="features"
        style={{
          background: "#F9FAFB",
          padding: isMobile ? "60px 20px" : "104px 48px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* header */}
          <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 68 }}>
            <div
              style={{
                display: "inline-block",
                background: "#EEF2FF",
                color: "#4F46E5",
                padding: "6px 18px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 18,
                border: "1px solid rgba(79,70,229,.18)",
              }}
            >
              Características
            </div>
            <h2
              style={{
                fontSize: isMobile ? "clamp(24px,6vw,36px)" : "clamp(28px,3.2vw,42px)",
                fontWeight: 800,
                color: "#111827",
                letterSpacing: "-0.8px",
                margin: "0 0 18px",
                lineHeight: 1.13,
              }}
            >
              Todo lo que necesitas para
              <br />
              tu contabilidad
            </h2>
            <p
              style={{
                fontSize: isMobile ? 14 : 17,
                color: "#6B7280",
                maxWidth: 520,
                margin: "0 auto",
                lineHeight: 1.65,
              }}
            >
              Una plataforma completa que elimina el trabajo manual y te permite
              enfocarte en hacer crecer tu negocio.
            </p>
          </div>

          {/* grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
              gap: isMobile ? 18 : 24,
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                className="lnd-card"
                onMouseEnter={() => !isMobile && setHoveredFeat(i)}
                onMouseLeave={() => !isMobile && setHoveredFeat(null)}
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  padding: "30px 30px 34px",
                  border: `1.5px solid ${!isMobile && hoveredFeat === i ? f.color + "44" : "#E5E7EB"}`,
                  boxShadow:
                    !isMobile && hoveredFeat === i
                      ? `0 12px 40px ${f.color}1a`
                      : "0 1px 4px rgba(0,0,0,.05)",
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 13,
                    background: f.bg,
                    border: `1.5px solid ${f.color}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 23,
                    marginBottom: 20,
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#111827",
                    margin: "0 0 10px",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "#6B7280",
                    lineHeight: 1.68,
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════ */}
      <section
        id="how"
        style={{
          background: "#fff",
          padding: isMobile ? "60px 20px" : "104px 48px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* header */}
          <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 68 }}>
            <div
              style={{
                display: "inline-block",
                background: "#F5F3FF",
                color: "#7C3AED",
                padding: "6px 18px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 18,
                border: "1px solid rgba(124,58,237,.18)",
              }}
            >
              Cómo funciona
            </div>
            <h2
              style={{
                fontSize: isMobile ? "clamp(24px,6vw,36px)" : "clamp(28px,3.2vw,42px)",
                fontWeight: 800,
                color: "#111827",
                letterSpacing: "-0.8px",
                margin: "0 0 18px",
                lineHeight: 1.13,
              }}
            >
              3 pasos. Sin complicaciones.
            </h2>
            <p
              style={{
                fontSize: isMobile ? 14 : 17,
                color: "#6B7280",
                maxWidth: 460,
                margin: "0 auto",
                lineHeight: 1.65,
              }}
            >
              Desde la carga de tu factura hasta el registro contable, todo en
              segundos.
            </p>
          </div>

          {/* steps */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
              gap: isMobile ? 18 : 28,
              position: "relative",
            }}
          >
            {/* connector */}
            {!isMobile && (
              <div
                style={{
                  position: "absolute",
                  top: 40,
                  left: "18%",
                  right: "18%",
                  height: 2,
                  background: "linear-gradient(90deg,#4F46E5,#7C3AED)",
                  opacity: 0.18,
                  zIndex: 0,
                }}
              />
            )}

            {steps.map((step, i) => (
              <div
                key={i}
                className="lnd-step"
                style={{
                  textAlign: "center",
                  padding: "36px 28px",
                  position: "relative",
                  zIndex: 1,
                  background: "#F9FAFB",
                  borderRadius: 20,
                  border: "1.5px solid #E5E7EB",
                  transition: "box-shadow 0.25s",
                }}
              >
                <div
                  className="lnd-step-num"
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    background: GRAD,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    boxShadow: "0 8px 28px rgba(79,70,229,.3)",
                  }}
                >
                  <span
                    style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}
                  >
                    {step.n}
                  </span>
                </div>
                <div style={{ fontSize: 30, marginBottom: 14 }}>
                  {step.icon}
                </div>
                <h3
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#111827",
                    margin: "0 0 12px",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "#6B7280",
                    lineHeight: 1.68,
                    margin: 0,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BENEFITS (before/after)
      ════════════════════════════════════════════════════ */}
      <section
        id="benefits"
        style={{
          background: "#F9FAFB",
          padding: isMobile ? "60px 20px" : "104px 48px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? 40 : 88,
              alignItems: isMobile ? "stretch" : "center",
            }}
          >
            {/* left – text */}
            <div>
              <div
                style={{
                  display: "inline-block",
                  background: "#DCFCE7",
                  color: "#16A34A",
                  padding: "6px 18px",
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 20,
                  border: "1px solid rgba(22,163,74,.2)",
                }}
              >
                Beneficios
              </div>
              <h2
                style={{
                  fontSize: isMobile ? "clamp(22px,6vw,32px)" : "clamp(26px,3vw,38px)",
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.8px",
                  margin: "0 0 20px",
                  lineHeight: 1.15,
                }}
              >
                Deja de hacer contabilidad
                <br />
                manualmente
              </h2>
              <p
                style={{
                  fontSize: isMobile ? 14 : 16,
                  color: "#6B7280",
                  lineHeight: 1.72,
                  margin: "0 0 32px",
                }}
              >
                Las pequeñas empresas y trabajadores independientes pierden
                horas cada semana ingresando facturas a mano. Karmen lo hace
                automáticamente, con mayor precisión y en una fracción del
                tiempo.
              </p>

              {[
                {
                  icon: "⚡",
                  text: "Procesa una factura en menos de 10 segundos",
                  color: "#4F46E5",
                },
                {
                  icon: "📋",
                  text: "Compatible con facturas PDF y formatos de imagen",
                  color: "#7C3AED",
                },
                {
                  icon: "🔄",
                  text: "Integración directa con tu plan de cuentas",
                  color: "#16A34A",
                },
                {
                  icon: "📤",
                  text: "Exporta reportes en Excel y PDF cuando quieras",
                  color: "#F59E0B",
                },
              ].map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 0",
                    borderBottom: i < 3 ? "1px solid #E5E7EB" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      flexShrink: 0,
                      background: `${b.color}10`,
                      border: `1.5px solid ${b.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                    }}
                  >
                    {b.icon}
                  </div>
                  <span
                    style={{
                      fontSize: isMobile ? 14 : 15,
                      color: "#374151",
                      fontWeight: 500,
                      lineHeight: 1.5,
                    }}
                  >
                    {b.text}
                  </span>
                </div>
              ))}
            </div>

            {/* right – comparison cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {/* before */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  border: "1.5px solid #FEE2E2",
                  padding: "26px 28px",
                  boxShadow: "0 4px 20px rgba(239,68,68,.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: "#FEE2E2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                    }}
                  >
                    😔
                  </div>
                  <span
                    style={{ fontSize: 15, fontWeight: 700, color: "#DC2626" }}
                  >
                    Sin Karmen
                  </span>
                </div>
                {[
                  "Ingresar datos manualmente uno a uno",
                  "Errores de transcripción frecuentes",
                  "3-5 horas semanales en facturas",
                  "Reportes desactualizados o inexistentes",
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      padding: "9px 0",
                      borderBottom: i < 3 ? "1px solid #FEE2E2" : "none",
                    }}
                  >
                    <span
                      style={{ color: "#EF4444", fontSize: 17, lineHeight: 1 }}
                    >
                      ✗
                    </span>
                    <span style={{ fontSize: 14, color: "#6B7280" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* after */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  border: "1.5px solid #DCFCE7",
                  padding: "26px 28px",
                  boxShadow: "0 4px 20px rgba(22,163,74,.07)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: "#DCFCE7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                    }}
                  >
                    🚀
                  </div>
                  <span
                    style={{ fontSize: 15, fontWeight: 700, color: "#16A34A" }}
                  >
                    Con Karmen
                  </span>
                </div>
                {[
                  "Extracción automática en segundos",
                  "98% de precisión garantizada",
                  "Ahorra hasta el 80% del tiempo",
                  "Reportes en tiempo real, siempre",
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      padding: "9px 0",
                      borderBottom: i < 3 ? "1px solid #DCFCE7" : "none",
                    }}
                  >
                    <span
                      style={{ color: "#16A34A", fontSize: 17, lineHeight: 1 }}
                    >
                      ✓
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: "#374151",
                        fontWeight: 500,
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA
      ════════════════════════════════════════════════════ */}
      <section
        style={{
          background:
            "linear-gradient(135deg,#4F46E5 0%,#7C3AED 55%,#6D28D9 100%)",
          padding: isMobile ? "60px 20px" : "108px 48px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px)," +
              "linear-gradient(90deg,rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        {/* blobs */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -40,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(255,255,255,.06) 0%,transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h2
            style={{
              fontSize: isMobile ? "clamp(28px,6vw,44px)" : "clamp(32px,4vw,52px)",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-1.2px",
              margin: "0 0 22px",
              lineHeight: 1.12,
            }}
          >
            Empieza hoy.
          </h2>
          <p
            style={{
              fontSize: isMobile ? 16 : 18,
              color: "rgba(255,255,255,.72)",
              maxWidth: 500,
              margin: "0 auto 44px",
              lineHeight: 1.65,
            }}
          >
            Regístrate en minutos y comienza a automatizar tu contabilidad de
            facturas.
          </p>
          <div
            style={{
              display: "flex",
              gap: 18,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className="lnd-btn-inv"
              onClick={() => navigate("/auth")}
              style={{
                background: "#fff",
                border: "none",
                color: "#4F46E5",
                borderRadius: 11,
                padding: "17px 38px",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                flex: isMobile ? "1 1 100%" : "0 0 auto",
              }}
            >
              Crear cuenta
            </button>
            <button
              className="lnd-btn-out"
              onClick={() => scrollTo("how")}
              style={{
                background: "transparent",
                border: "1.5px solid rgba(255,255,255,.45)",
                color: "#fff",
                borderRadius: 11,
                padding: "17px 38px",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                flex: isMobile ? "1 1 100%" : "0 0 auto",
              }}
            >
              Ver cómo funciona
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: "#0A0F1E",
          padding: isMobile ? "40px 20px 24px" : "68px 48px 32px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* top grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr",
              gap: isMobile ? 32 : 52,
              marginBottom: 32,
              paddingBottom: 32,
              borderBottom: "1px solid rgba(255,255,255,.08)",
            }}
          >
            {/* brand */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: GRAD,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#fff",
                    boxShadow: "0 4px 12px rgba(79,70,229,.4)",
                  }}
                >
                  K
                </div>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>
                  Karmen
                </span>
              </div>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,.48)",
                  maxWidth: 280,
                  margin: 0,
                }}
              >
                Plataforma de automatización contable para pequeñas empresas y
                trabajadores independientes de Colombia.
              </p>
            </div>

            {[
              {
                title: "Producto",
                links: ["Características", "Cómo funciona", "Seguridad"],
              },
              { title: "Empresa", links: ["Acerca de", "Blog", "Contacto"] },
              { title: "Legal", links: ["Privacidad", "Términos", "Cookies"] },
            ].map((col, i) => (
              <div key={i}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    marginBottom: 18,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                  }}
                >
                  {col.title}
                </div>
                {col.links.map((lnk, j) => (
                  <div
                    key={j}
                    className="lnd-footer-lnk"
                    style={{
                      fontSize: 14,
                      marginBottom: 12,
                      color: "rgba(255,255,255,.48)",
                    }}
                  >
                    {lnk}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* bottom */}
          <div
            style={{
              display: "flex",
              justifyContent: isMobile ? "center" : "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 13, color: "rgba(255,255,255,.35)" }}>
              © 2026 Karmen. Todos los derechos reservados.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
