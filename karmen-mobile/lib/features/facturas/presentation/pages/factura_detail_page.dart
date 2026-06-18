import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/karmen_colors_extension.dart';
import '../../../../core/utils/currency_format.dart';
import '../../../../core/widgets/status_badge.dart';
import '../../domain/entities/factura.dart';
import '../bloc/facturas_bloc.dart';
import '../bloc/facturas_event.dart';
import '../bloc/facturas_state.dart';

class FacturaDetailPage extends StatelessWidget {
  final String facturaId;
  final Factura? factura;

  const FacturaDetailPage({
    super.key,
    required this.facturaId,
    this.factura,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<FacturasBloc>(),
      child: _FacturaDetailView(factura: factura),
    );
  }
}

class _FacturaDetailView extends StatelessWidget {
  final Factura? factura;
  const _FacturaDetailView({this.factura});

  @override
  Widget build(BuildContext context) {
    final c = context.kc;

    if (factura == null) {
      return Scaffold(
        backgroundColor: c.bg,
        appBar: AppBar(
          title: Text('Detalle',
              style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
        ),
        body: Center(
          child: Text('Factura no disponible',
              style: GoogleFonts.inter(color: c.textSub)),
        ),
      );
    }

    return BlocListener<FacturasBloc, FacturasState>(
      listener: (context, state) {
        if (state is FacturasContabilizarSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('Factura contabilizada exitosamente',
                style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
            backgroundColor: c.green,
            behavior: SnackBarBehavior.floating,
          ));
          // context.go fuerza reconstrucción de FacturasPage → recarga datos
          context.go('/dashboard');
        } else if (state is FacturasError) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(state.message),
            backgroundColor: c.red,
            behavior: SnackBarBehavior.floating,
          ));
        }
      },
      child: Scaffold(
        backgroundColor: c.bg,
        appBar: AppBar(
          title: Text('Detalle de Factura',
              style: GoogleFonts.inter(
                  fontSize: 18, fontWeight: FontWeight.w700)),
        ),
        body: _FacturaDetailBody(factura: factura!, c: c),
      ),
    );
  }
}

class _FacturaDetailBody extends StatelessWidget {
  final Factura factura;
  final KarmenColors c;

  const _FacturaDetailBody({required this.factura, required this.c});

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('dd MMMM yyyy', 'es');
    final isIngreso = factura.isIngreso;
    final amountColor = isIngreso ? c.green : c.red;
    final iconBg = isIngreso ? c.greenLight : c.redLight;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Monto destacado
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: AppTheme.cardDecoration(c),
            child: Column(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
                  child: Icon(
                    isIngreso
                        ? Icons.arrow_downward_rounded
                        : Icons.arrow_upward_rounded,
                    color: amountColor,
                    size: 28,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  formatCOP(factura.amount),
                  style: GoogleFonts.inter(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: amountColor),
                ),
                const SizedBox(height: 8),
                StatusBadge(factura.status),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Detalles
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            decoration: AppTheme.cardDecoration(c),
            child: Column(
              children: [
                _Row('Tipo', factura.type, c),
                _Div(c),
                _Row('Moneda', factura.currency, c),
                _Div(c),
                _Row('Fecha', dateFmt.format(factura.issueDate), c),
                if (factura.providerName != null) ...[
                  _Div(c),
                  _Row('Proveedor', factura.providerName!, c),
                ],
                if (factura.taxId != null && factura.taxId!.isNotEmpty) ...[
                  _Div(c),
                  _Row('NIT', factura.taxId!, c),
                ],
                if (factura.paymentMethod != null &&
                    factura.paymentMethod!.isNotEmpty) ...[
                  _Div(c),
                  _Row('Método de pago', factura.paymentMethod!, c),
                ],
                if (factura.description != null &&
                    factura.description!.isNotEmpty) ...[
                  _Div(c),
                  _Row('Notas', factura.description!, c),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Botón contabilizar — el backend solo acepta facturas en PENDIENTE
          if (factura.isPendiente)
            BlocBuilder<FacturasBloc, FacturasState>(
              builder: (context, state) {
                final isLoading = state is FacturasLoading;
                return ElevatedButton.icon(
                  onPressed: isLoading
                      ? null
                      : () => context
                          .read<FacturasBloc>()
                          .add(FacturaContabilizarRequested(factura.id)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: c.accent,
                    minimumSize: const Size(double.infinity, 48),
                  ),
                  icon: isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.account_balance_outlined, size: 20),
                  label: Text(
                    isLoading
                        ? 'Generando asientos (puede tardar)...'
                        : 'Contabilizar factura',
                    style: GoogleFonts.inter(
                        fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final KarmenColors c;
  const _Row(this.label, this.value, this.c);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: GoogleFonts.inter(fontSize: 13, color: c.textSub)),
            const SizedBox(width: 16),
            Flexible(
              child: Text(value,
                  textAlign: TextAlign.end,
                  style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: c.text)),
            ),
          ],
        ),
      );
}

class _Div extends StatelessWidget {
  final KarmenColors c;
  const _Div(this.c);

  @override
  Widget build(BuildContext context) =>
      Divider(color: c.border, height: 1, thickness: 1);
}
