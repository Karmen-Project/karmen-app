import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart' show DateFormat;

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/karmen_colors_extension.dart';
import '../../../../core/utils/currency_format.dart';
import '../../../../core/widgets/status_badge.dart';
import '../../domain/entities/factura.dart';

class FacturaCard extends StatelessWidget {
  final Factura factura;
  final VoidCallback onTap;

  const FacturaCard({super.key, required this.factura, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    final dateFmt = DateFormat('dd MMM yyyy', 'es');

    final isIngreso = factura.isIngreso;
    final amountColor = isIngreso ? c.green : c.red;
    final iconBg = isIngreso ? c.greenLight : c.redLight;

    return Container(
      decoration: AppTheme.cardDecoration(c),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                    color: iconBg, borderRadius: BorderRadius.circular(8)),
                child: Icon(
                  isIngreso
                      ? Icons.arrow_downward_rounded
                      : Icons.arrow_upward_rounded,
                  color: amountColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            '${factura.type} - ${factura.providerName ?? 'Sin proveedor'}',
                            style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: c.text),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        StatusBadge(factura.status),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      formatCOP(factura.amount),
                      style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: amountColor),
                    ),
                    const SizedBox(height: 2),
                    Text(dateFmt.format(factura.issueDate),
                        style: GoogleFonts.inter(
                            fontSize: 12, color: c.textSub)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(Icons.chevron_right_rounded, color: c.textMuted, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
