package com.karmen.api.domain.constant;

/**
 * Tipos de factura. Fuente única de verdad para evitar "magic strings".
 *
 * <p>Se mantiene como constantes {@code String} (no enum) para no alterar el
 * mapeo en BD ni el contrato JSON con el frontend.</p>
 */
public final class InvoiceType {

    public static final String INGRESO = "INGRESO";
    public static final String EGRESO  = "EGRESO";

    private InvoiceType() {
        // Clase de constantes: no instanciable.
    }
}
