import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../constants/app_constants.dart';
import '../theme/karmen_colors_extension.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge(this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    final Color bg;
    final Color textColor;

    switch (status.toLowerCase()) {
      case AppConstants.invoiceStatusConfirmada:
      case AppConstants.invoiceStatusContabilizada:
        bg = c.greenLight;
        textColor = c.greenText;
      case AppConstants.invoiceStatusPendiente:
        bg = c.orangeLight;
        textColor = c.orange;
      default:
        bg = c.accentLight;
        textColor = c.accent;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(
        status,
        style: GoogleFonts.inter(
            fontSize: 12, fontWeight: FontWeight.w600, color: textColor),
      ),
    );
  }
}
