import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../utils/theme/ThemeContext.jsx";
import { useResponsive } from "../utils/useResponsive.js";
import Sidebar from "../components/Sidebar/Sidebar.jsx";
import {
  uploadInvoice,
  confirmInvoice,
  getInvoiceById,
} from "../api/invoices.js";
import { getAccounts } from "../api/accounts.js";
import { getProviders } from "../api/providers.js";
import { getCompanyId } from "../api/endPoints.js";
import { PUC_DEFAULT_MAIN_ACCOUNT as DEFAULTS } from "../constants/index.js";
import {
  MdErrorOutline, MdInfoOutline, MdAttachFile, MdClose, MdCloudUpload,
  MdHourglassEmpty, MdSearch, MdCheck, MdCheckCircle, MdReceiptLong,
} from "react-icons/md";

// Espera a que el OCR llene los campos de la factura (hasta ~40 s)
async function waitForOcrData(invoiceId) {
  const MAX = 20;
  const DELAY = 2000;
  for (let i = 0; i < MAX; i++) {
    await new Promise((r) => setTimeout(r, DELAY));
    try {
      const updated = await getInvoiceById(invoiceId);
      const hasData =
        (updated.total && Number(updated.total) > 0) ||
        (updated.subtotal && Number(updated.subtotal) > 0) ||
        updated.invoiceDate ||
        updated.providerName;
      if (hasData) return updated;
    } catch {
      /* seguir intentando */
    }
  }
  return null; // OCR no terminó a tiempo — el usuario ingresa los datos manualmente
}

function buildForm(inv) {
  if (!inv)
    return {
      invoiceNumber: "",
      providerName: "",
      invoiceDate: "",
      notes: "",
      subtotal: "",
      taxAmount: "",
      total: "",
      taxId: "",
      paymentMethod: "",
    };
  return {
    invoiceNumber: inv.invoiceNumber || "",
    providerName: inv.providerName || "",
    invoiceDate: inv.invoiceDate || "",
    notes: inv.notes || "",
    subtotal: inv.subtotal != null ? String(inv.subtotal) : "",
    taxAmount: inv.taxAmount != null ? String(inv.taxAmount) : "",
    total: inv.total != null ? String(inv.total) : "",
    taxId: inv.taxId || "",
    paymentMethod: inv.paymentMethod || "",
  };
}

// Campo de formulario reutilizable: etiqueta (+ hint opcional) sobre su control.
// Definido a nivel de módulo para que no se recree en cada render (evita que el
// input pierda el foco). El control va como children y conserva su propio estilo.
function Field({ T, label, hint, marginBottom = 14, children }) {
  return (
    <div style={{ marginBottom }}>
      <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6, color: T.text }}>
        {label}
        {hint && (
          <span style={{ fontSize: 11, fontWeight: 400, color: T.sub, marginLeft: 8 }}>{hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

export default function CargarFactura() {
  const { T } = useTheme();
  const { isMobile, mainPadding } = useResponsive();
  const navigate = useNavigate();
  const [tipo, setTipo] = useState("INGRESO");
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [uploadedInvoice, setUploadedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(buildForm(null));
  const [accounts, setAccounts] = useState([]);
  const [accountCode, setAccountCode] = useState(DEFAULTS.INGRESO);
  const [providers, setProviders] = useState([]);
  const [providerId, setProviderId] = useState("");
  const inputRef = useRef();

  useEffect(() => {
    const companyId = getCompanyId();
    if (!companyId) return;
    getAccounts(companyId).then(setAccounts).catch(() => {});
    getProviders(companyId).then(data => setProviders(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  // Resetear cuenta a default cuando cambia el tipo de factura
  useEffect(() => {
    setAccountCode(DEFAULTS[tipo]);
  }, [tipo]);

  const handleFile = (f) => {
    if (f) {
      setFile(f);
      setError(null);
    }
  };

  // Pegar imagen desde portapapeles (Ctrl+V / captura de pantalla)
  useEffect(() => {
    const onPaste = (e) => {
      if (uploadedInvoice) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (!blob) continue;
          // Escalar la imagen 2× para mejorar calidad OCR (pantalla ~96 DPI → ~192 DPI)
          const objectUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            const scale = img.width < 2000 ? 2 : 1;
            const canvas = document.createElement("canvas");
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(objectUrl);
            canvas.toBlob((scaled) => {
              if (!scaled) return;
              handleFile(new File([scaled], "captura-factura.png", { type: "image/png" }));
            }, "image/png");
          };
          img.src = objectUrl;
          break;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [uploadedInvoice]);

  const handleUpload = async () => {
    if (!file) return;
    const companyId = getCompanyId();
    if (!companyId) {
      setError("No se encontró la empresa del usuario");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Subir archivo — el backend crea la factura y dispara OCR en segundo plano
      const initial = await uploadInvoice(companyId, tipo, file);
      setUploadedInvoice(initial);
      setForm(buildForm(initial));

      // 2. Esperar a que el OCR extraiga los datos (polling)
      setPolling(true);
      const withOcr = await waitForOcrData(initial.id);
      if (withOcr) {
        setUploadedInvoice(withOcr);
        setForm(buildForm(withOcr));
      }
    } catch (e) {
      setError(e.message || "Error al subir el archivo");
    } finally {
      setLoading(false);
      setPolling(false);
    }
  };

  const handleConfirm = async () => {
    if (!uploadedInvoice) return;
    setLoading(true);
    setError(null);
    try {
      await confirmInvoice(uploadedInvoice.id, {
        invoiceNumber: form.invoiceNumber,
        invoiceDate: form.invoiceDate || null,
        subtotal: form.subtotal ? parseFloat(form.subtotal) : null,
        taxAmount: form.taxAmount ? parseFloat(form.taxAmount) : null,
        total: form.total ? parseFloat(form.total) : null,
        notes: form.notes || null,
        accountCode: accountCode || null,
        providerId: providerId ? parseInt(providerId, 10) : null,
        rfc: form.taxId || null,
        paymentMethod: form.paymentMethod || null,
      });
      navigate("/facturas");
    } catch (e) {
      setError(e.message || "Error al confirmar la factura");
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    padding: "9px 12px",
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
        background: T.bg,
        minHeight: "100vh",
        transition: "background 0.2s",
        ...mainPadding,
      }}
    >
      <Sidebar />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? 16 : 32 }}>
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: 24,
            fontWeight: 800,
            color: T.text,
          }}
        >
          Cargar Factura
        </h1>
        <p style={{ margin: "0 0 28px", color: T.sub }}>
          Carga tu factura en PDF o imagen y extrae los datos automáticamente
        </p>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: T.redLt,
              color: T.red,
              borderRadius: T.radiusSm,
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            <MdErrorOutline style={{ verticalAlign: "middle", marginRight: 6 }} />{error}
          </div>
        )}

        <div
          style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 16 : 24 }}
        >
          {/* ── Panel izquierdo: selección de archivo ── */}
          <div
            style={{
              background: T.white,
              borderRadius: T.radius,
              padding: 24,
              boxShadow: T.shadow,
            }}
          >
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: 15,
                fontWeight: 700,
                color: T.text,
              }}
            >
              1. Selecciona el archivo
            </h3>

            <Field T={T} label="Tipo de Factura" marginBottom={16}>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                style={inp}
                disabled={!!uploadedInvoice}
              >
                <option value="INGRESO">Ingreso (Factura emitida)</option>
                <option value="EGRESO">Egreso (Factura recibida)</option>
              </select>
            </Field>

            {/* ── Proveedor / Cliente ── */}
            <Field T={T} label="Proveedor / Cliente" hint="(opcional)" marginBottom={16}>
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                style={inp}
              >
                <option value="">— Sin asignar —</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.nit ? ` · ${p.nit}` : ""}
                  </option>
                ))}
              </select>
              {!providerId && form.providerName && (
                <div style={{ marginTop: 6, fontSize: 12, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}>
                  <MdInfoOutline style={{ color: T.accent }} />
                  OCR detectó: <strong style={{ color: T.text }}>{form.providerName}</strong>
                </div>
              )}
            </Field>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => !uploadedInvoice && inputRef.current.click()}
              style={{
                border: `2px dashed ${drag ? T.accent : T.border}`,
                borderRadius: T.radius,
                background: drag ? T.accentLt : T.surface,
                padding: "32px 20px",
                textAlign: "center",
                cursor: uploadedInvoice ? "default" : "pointer",
                marginBottom: 16,
                transition: "all 0.2s",
                opacity: uploadedInvoice ? 0.6 : 1,
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFile(e.target.files[0])}
                style={{ display: "none" }}
                disabled={!!uploadedInvoice}
              />
              {file ? (
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      marginBottom: 4,
                      color: T.text,
                    }}
                  >
                    <MdAttachFile style={{ verticalAlign: "middle", marginRight: 4 }} />{file.name}
                  </div>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </div>
                  {!uploadedInvoice && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      style={{
                        fontSize: 12,
                        color: T.red,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <MdClose style={{ verticalAlign: "middle" }} /> Quitar
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 8, color: T.sub }}><MdCloudUpload size={32} /></div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>
                    Click para seleccionar archivo
                  </div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>
                    PDF, JPG o PNG · Arrastra aquí · o pega con{" "}
                    <kbd style={{
                      padding: "1px 5px", borderRadius: 4,
                      border: `1px solid ${T.border}`,
                      background: T.surface, fontSize: 11,
                      fontFamily: "monospace", color: T.text,
                    }}>Ctrl+V</kbd>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading || !!uploadedInvoice}
              style={{
                width: "100%",
                padding: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: file && !uploadedInvoice ? T.btn : T.muted,
                color: "white",
                border: "none",
                borderRadius: T.radiusSm,
                fontWeight: 700,
                fontSize: 14,
                cursor: file && !uploadedInvoice ? "pointer" : "not-allowed",
              }}
            >
              {loading && !polling ? (
                <><MdHourglassEmpty /> Subiendo...</>
              ) : polling ? (
                <><MdSearch /> Extrayendo datos con OCR...</>
              ) : uploadedInvoice ? (
                <><MdCheck /> Archivo procesado</>
              ) : (
                <><MdReceiptLong /> Subir y Extraer Datos</>
              )}
            </button>

            <div
              style={{
                marginTop: 16,
                padding: "12px 16px",
                background: T.accentLt,
                borderRadius: T.radiusSm,
                fontSize: 13,
                color: T.accent,
              }}
            >
              <MdInfoOutline style={{ verticalAlign: "middle", marginRight: 6 }} /><strong>Tecnología OCR:</strong> Extrae automáticamente todos
              los datos de tu factura.
            </div>
          </div>

          {/* ── Panel derecho: verificar y editar datos ── */}
          <div
            style={{
              background: T.white,
              borderRadius: T.radius,
              padding: 24,
              boxShadow: T.shadow,
            }}
          >
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: 15,
                fontWeight: 700,
                color: T.text,
              }}
            >
              2. Verifica y edita los datos
            </h3>

            {!uploadedInvoice ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: T.muted,
                }}
              >
                <div style={{ marginBottom: 12 }}><MdReceiptLong size={48} /></div>
                <div style={{ fontSize: 14 }}>Primero carga un archivo</div>
              </div>
            ) : polling ? (
              /* Estado: OCR en proceso */
              <div
                style={{ textAlign: "center", padding: "48px 0", color: T.sub }}
              >
                <div style={{ marginBottom: 16 }}><MdSearch size={40} /></div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: T.text,
                  }}
                >
                  Extrayendo datos del documento...
                </div>
                <div style={{ fontSize: 13 }}>
                  El OCR está leyendo tu factura. Un momento.
                </div>
                <div
                  style={{
                    marginTop: 20,
                    height: 4,
                    background: T.border,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: "60%",
                      background: T.accent,
                      borderRadius: 2,
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Estado: datos listos para revisar */
              <div>
                <div
                  style={{
                    padding: "10px 14px",
                    background: T.greenLt,
                    borderRadius: T.radiusSm,
                    color: T.greenText,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 20,
                  }}
                >
                  <MdCheckCircle style={{ verticalAlign: "middle", marginRight: 6 }} />Factura cargada — Verifica los datos y confirma
                </div>

                {/* Número de factura */}
                <Field T={T} label="Número de Factura">
                  <input
                    value={form.invoiceNumber}
                    onChange={(e) =>
                      setForm({ ...form, invoiceNumber: e.target.value })
                    }
                    style={inp}
                  />
                </Field>

                {/* Fecha */}
                <Field T={T} label="Fecha de Emisión">
                  <input
                    value={form.invoiceDate}
                    onChange={(e) =>
                      setForm({ ...form, invoiceDate: e.target.value })
                    }
                    style={inp}
                    type="date"
                  />
                </Field>

                {/* NIT y Medio de Pago */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <Field T={T} label="NIT / Tax ID" marginBottom={0}>
                    <input
                      value={form.taxId}
                      onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                      style={inp}
                      placeholder="Ej: 901.331.844-8"
                    />
                  </Field>
                  <Field T={T} label="Medio de Pago" marginBottom={0}>
                    <input
                      value={form.paymentMethod}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      style={inp}
                      placeholder="Ej: Efectivo, Crédito..."
                    />
                  </Field>
                </div>

                {/* Notas */}
                <Field T={T} label="Notas / Descripción">
                  <input
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    style={inp}
                  />
                </Field>

                {/* Montos */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  {[
                    ["Subtotal", "subtotal"],
                    ["IVA", "taxAmount"],
                    ["Total", "total"],
                  ].map(([lbl, key]) => (
                    <Field key={key} T={T} label={lbl} marginBottom={0}>
                      <input
                        value={form[key]}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.value })
                        }
                        style={inp}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </Field>
                  ))}
                </div>

                {/* ── Cuenta contable ── */}
                <Field T={T} label="Cuenta contable" hint="(opcional — usa default PUC si no se selecciona)" marginBottom={20}>
                  <select
                    value={accountCode}
                    onChange={(e) => setAccountCode(e.target.value)}
                    style={inp}
                  >
                    <option value="">— Default PUC —</option>
                    {accounts
                      .filter((a) => a.active)
                      .map((a) => (
                        <option key={a.id} value={a.code}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                  </select>
                </Field>

                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    background: T.btn,
                    color: "white",
                    border: "none",
                    borderRadius: T.radiusSm,
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 14,
                  }}
                >
                  {loading ? (
                    <><MdHourglassEmpty /> Guardando...</>
                  ) : (
                    <><MdCheck /> Confirmar y Contabilizar</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
