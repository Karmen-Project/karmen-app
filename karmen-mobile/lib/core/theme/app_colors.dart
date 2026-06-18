import 'package:flutter/material.dart';

// ─── Light Theme ─────────────────────────────────────────────────────────────
// Tokens exactos del frontend karmen (src/utils/theme/index.js)
class AppColors {
  // Backgrounds
  static const Color bg = Color(0xFFEEF2F7);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceSecondary = Color(0xFFF9FAFB);

  // Borders
  static const Color border = Color(0xFFE5E7EB);

  // Text
  static const Color text = Color(0xFF111827);
  static const Color textSub = Color(0xFF6B7280);
  static const Color textMuted = Color(0xFF9CA3AF);

  // Accent (primary brand – indigo)
  static const Color accent = Color(0xFF4F46E5);
  static const Color accentLight = Color(0xFFEEF2FF);

  // Button primary bg
  static const Color btnBg = Color(0xFF111827);

  // Success
  static const Color green = Color(0xFF16A34A);
  static const Color greenLight = Color(0xFFDCFCE7);
  static const Color greenText = Color(0xFF15803D);

  // Error
  static const Color red = Color(0xFFDC2626);
  static const Color redLight = Color(0xFFFEE2E2);
  static const Color redText = Color(0xFFB91C1C);

  // Warning
  static const Color orange = Color(0xFFF59E0B);
  static const Color orangeLight = Color(0xFFFEF3C7);

  // Purple
  static const Color purple = Color(0xFF7C3AED);
  static const Color purpleLight = Color(0xFFF5F3FF);
}

// ─── Dark Theme ──────────────────────────────────────────────────────────────
class AppColorsDark {
  static const Color bg = Color(0xFF0F172A);
  static const Color surface = Color(0xFF1E293B);
  static const Color surfaceSecondary = Color(0xFF162032);
  static const Color border = Color(0xFF334155);

  static const Color text = Color(0xFFF1F5F9);
  static const Color textSub = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  static const Color accent = Color(0xFF818CF8);
  static const Color accentLight = Color(0xFF1E1B4B);

  static const Color btnBg = Color(0xFF334155);

  static const Color green = Color(0xFF4ADE80);
  static const Color greenLight = Color(0xFF052E16);
  static const Color greenText = Color(0xFF4ADE80);

  static const Color red = Color(0xFFF87171);
  static const Color redLight = Color(0xFF450A0A);
  static const Color redText = Color(0xFFFCA5A5);

  static const Color orange = Color(0xFFFB923C);
  static const Color orangeLight = Color(0xFF431407);

  static const Color purple = Color(0xFFA78BFA);
  static const Color purpleLight = Color(0xFF2E1065);
}
