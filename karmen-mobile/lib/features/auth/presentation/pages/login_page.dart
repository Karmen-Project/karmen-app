import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/karmen_colors_extension.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';
import '../widgets/login_form.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return Scaffold(
      backgroundColor: c.bg,
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthFailureState) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(state.message),
              backgroundColor: c.red,
              behavior: SnackBarBehavior.floating,
            ));
          }
        },
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 24),
                _Logo(),
                const SizedBox(height: 32),
                _AuthCard(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Logo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [c.accent, c.purple],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: c.accent.withValues(alpha: 0.35),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: const Icon(Icons.receipt_long_rounded,
              color: Colors.white, size: 28),
        ),
        const SizedBox(height: 16),
        Text('Karmen',
            style: GoogleFonts.inter(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: c.text,
                letterSpacing: -0.5)),
        const SizedBox(height: 4),
        Text('Gestión contable inteligente',
            style: GoogleFonts.inter(fontSize: 14, color: c.textSub)),
      ],
    );
  }
}

class _AuthCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return Container(
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.border),
        boxShadow: const [
          BoxShadow(color: Color(0x14000000), blurRadius: 3, offset: Offset(0, 1)),
        ],
      ),
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Iniciar sesión',
              style: GoogleFonts.inter(
                  fontSize: 18, fontWeight: FontWeight.w700, color: c.text)),
          const SizedBox(height: 4),
          Text('Ingresa tus credenciales para continuar',
              style: GoogleFonts.inter(fontSize: 13, color: c.textSub)),
          const SizedBox(height: 24),
          const LoginForm(),
          const SizedBox(height: 20),
          _BiometricButton(),
        ],
      ),
    );
  }
}

class _BiometricButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        return SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: state is AuthLoading
                ? null
                : () => context
                    .read<AuthBloc>()
                    .add(const AuthBiometricRequested()),
            style: OutlinedButton.styleFrom(
              foregroundColor: c.accent,
              side: BorderSide(color: c.border),
              padding: const EdgeInsets.symmetric(vertical: 11),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            icon: const Icon(Icons.fingerprint_rounded, size: 20),
            label: Text('Acceder con biometría',
                style: GoogleFonts.inter(
                    fontSize: 14, fontWeight: FontWeight.w600)),
          ),
        );
      },
    );
  }
}
