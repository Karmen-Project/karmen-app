import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/karmen_colors_extension.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/auth/presentation/bloc/auth_event.dart';

class MainScaffold extends StatelessWidget {
  final Widget child;
  final String location;

  const MainScaffold({super.key, required this.child, required this.location});

  int get _currentIndex {
    if (location.startsWith('/dashboard')) return 0;
    if (location.startsWith('/upload-factura')) return 1;
    if (location.startsWith('/reportes')) return 2;
    if (location.startsWith('/notifications')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final c = context.kc;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: c.surface,
          border: Border(top: BorderSide(color: c.border)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 60,
            child: Row(
              children: [
                _NavItem(
                  icon: Icons.receipt_long_outlined,
                  activeIcon: Icons.receipt_long_rounded,
                  label: 'Dashboard',
                  selected: _currentIndex == 0,
                  onTap: () => context.go('/dashboard'),
                ),
                _NavItem(
                  icon: Icons.add_circle_outline_rounded,
                  activeIcon: Icons.add_circle_rounded,
                  label: 'Cargar',
                  selected: _currentIndex == 1,
                  onTap: () => context.go('/upload-factura'),
                ),
                _NavItem(
                  icon: Icons.bar_chart_outlined,
                  activeIcon: Icons.bar_chart_rounded,
                  label: 'Reportes',
                  selected: _currentIndex == 2,
                  onTap: () => context.go('/reportes'),
                ),
                _NavItem(
                  icon: Icons.notifications_outlined,
                  activeIcon: Icons.notifications_rounded,
                  label: 'Alertas',
                  selected: _currentIndex == 3,
                  onTap: () => context.go('/notifications'),
                ),
                _LogoutItem(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    final color = selected ? c.accent : c.textSub;

    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(selected ? activeIcon : icon, size: 22, color: color),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LogoutItem extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return Expanded(
      child: InkWell(
        onTap: () => _confirmLogout(context),
        borderRadius: BorderRadius.circular(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.logout_rounded, size: 22, color: c.textSub),
            const SizedBox(height: 2),
            Text(
              'Salir',
              style: GoogleFonts.inter(
                  fontSize: 11, fontWeight: FontWeight.w500, color: c.textSub),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    final c = context.kc;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: c.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text('Cerrar sesión',
            style: GoogleFonts.inter(
                fontWeight: FontWeight.w700, color: c.text)),
        content: Text('¿Estás segura de que quieres salir?',
            style: GoogleFonts.inter(fontSize: 14, color: c.textSub)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancelar',
                style: GoogleFonts.inter(
                    color: c.textSub, fontWeight: FontWeight.w500)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<AuthBloc>().add(const AuthLogoutRequested());
            },
            style: TextButton.styleFrom(foregroundColor: c.red),
            child: Text('Salir',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
