package com.karmen.api.domain.constant;

/**
 * Estados posibles de una factura. Fuente única de verdad para evitar
 * "magic strings" dispersos por los servicios.
 *
 * <p>Se mantiene como constantes {@code String} (no enum) para no alterar el
 * mapeo en BD ni el contrato JSON con el frontend, que siguen usando estos
 * mismos valores de texto.</p>
 */
public final class InvoiceStatus {

    public static final String PENDIENTE     = "PENDIENTE";
    public static final String CONFIRMADA    = "CONFIRMADA";
    public static final String CONTABILIZADA = "CONTABILIZADA";
    public static final String RECHAZADA     = "RECHAZADA";

    private InvoiceStatus() {
        // Clase de constantes: no instanciable.
    }
}
