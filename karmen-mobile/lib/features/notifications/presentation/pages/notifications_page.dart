import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/karmen_colors_extension.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return Scaffold(
      backgroundColor: c.bg,
      appBar: AppBar(
        title: Text('Notificaciones',
            style: GoogleFonts.inter(
                fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _NotificationTile(
            icon: Icons.receipt_long_rounded,
            title: 'Nueva factura recibida',
            subtitle: 'Se ha procesado una factura con OCR.',
            time: 'Hace 5 min',
            iconColorFn: (c) => c.accent,
            iconBgFn: (c) => c.accentLight,
          ),
          const SizedBox(height: 10),
          _NotificationTile(
            icon: Icons.check_circle_outline_rounded,
            title: 'Factura confirmada',
            subtitle: 'La factura #F-001 fue confirmada exitosamente.',
            time: 'Hace 1 hora',
            iconColorFn: (c) => c.green,
            iconBgFn: (c) => c.greenLight,
          ),
          const SizedBox(height: 10),
          _NotificationTile(
            icon: Icons.warning_amber_rounded,
            title: 'Factura pendiente',
            subtitle: 'Tienes 3 facturas pendientes de revisión.',
            time: 'Hoy',
            iconColorFn: (c) => c.orange,
            iconBgFn: (c) => c.orangeLight,
          ),
        ],
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String time;
  final Color Function(KarmenColors) iconColorFn;
  final Color Function(KarmenColors) iconBgFn;

  const _NotificationTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.time,
    required this.iconColorFn,
    required this.iconBgFn,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.cardDecoration(c),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
                color: iconBgFn(c), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: iconColorFn(c), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(title,
                          style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: c.text)),
                    ),
                    Text(time,
                        style: GoogleFonts.inter(
                            fontSize: 11, color: c.textMuted)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(subtitle,
                    style: GoogleFonts.inter(
                        fontSize: 13, color: c.textSub)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
