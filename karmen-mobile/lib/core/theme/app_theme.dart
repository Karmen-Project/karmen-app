import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import 'karmen_colors_extension.dart';

// Border radius – igual al frontend (radius = 12, radiusSm = 8)
const _radius = 12.0;
const _radiusSm = 8.0;

// Sombra sutil – igual al frontend (0 1px 3px rgba(0,0,0,0.08))
const _shadow = BoxShadow(
  color: Color(0x14000000),
  blurRadius: 3,
  offset: Offset(0, 1),
);

// Sombra media (0 4px 12px rgba(0,0,0,0.10))
const _shadowMd = BoxShadow(
  color: Color(0x1A000000),
  blurRadius: 12,
  offset: Offset(0, 4),
);

class AppTheme {
  // ─── Light ──────────────────────────────────────────────────────────────────
  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.bg,
      colorScheme: const ColorScheme(
        brightness: Brightness.light,
        primary: AppColors.accent,
        onPrimary: Colors.white,
        secondary: AppColors.purple,
        onSecondary: Colors.white,
        error: AppColors.red,
        onError: Colors.white,
        surface: AppColors.surface,
        onSurface: AppColors.text,
      ),
    );

    return base.copyWith(
      textTheme: GoogleFonts.interTextTheme(base.textTheme).copyWith(
        displayLarge: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.w800, color: AppColors.text),
        headlineMedium: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.text),
        titleLarge: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.text),
        titleMedium: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.text),
        titleSmall: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.text),
        bodyLarge: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w400, color: AppColors.text),
        bodyMedium: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w400, color: AppColors.text),
        bodySmall: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w400, color: AppColors.textSub),
        labelSmall: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.textMuted),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.text,
        elevation: 0,
        centerTitle: false,
        shadowColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.text,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_radius),
          side: const BorderSide(color: AppColors.border),
        ),
        margin: EdgeInsets.zero,
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 1,
        space: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceSecondary,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.text),
        hintStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radiusSm),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radiusSm),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radiusSm),
          borderSide: const BorderSide(color: AppColors.accent, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radiusSm),
          borderSide: const BorderSide(color: AppColors.red),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radiusSm),
          borderSide: const BorderSide(color: AppColors.red, width: 1.5),
        ),
        errorStyle: GoogleFonts.inter(fontSize: 12, color: AppColors.redText),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.btnBg,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 44),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusSm)),
          textStyle: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700),
          disabledBackgroundColor: AppColors.btnBg.withValues(alpha: 0.6),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.text,
          side: const BorderSide(color: AppColors.border),
          minimumSize: const Size(0, 40),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusSm)),
          textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.accent,
          textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusSm)),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surfaceSecondary,
        labelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        shape: const StadiumBorder(),
        side: BorderSide.none,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.accent,
        unselectedItemColor: AppColors.textSub,
        selectedLabelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500),
        elevation: 0,
        type: BottomNavigationBarType.fixed,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.accent,
        foregroundColor: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius)),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusSm)),
        contentTextStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
      ),
    );
  }

  // ─── Dark ───────────────────────────────────────────────────────────────────
  static ThemeData get dark {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColorsDark.bg,
      colorScheme: const ColorScheme(
        brightness: Brightness.dark,
        primary: AppColorsDark.accent,
        onPrimary: Colors.white,
        secondary: AppColorsDark.purple,
        onSecondary: Colors.white,
        error: AppColorsDark.red,
        onError: Colors.white,
        surface: AppColorsDark.surface,
        onSurface: AppColorsDark.text,
      ),
    );

    return base.copyWith(
      textTheme: GoogleFonts.interTextTheme(base.textTheme).copyWith(
        displayLarge: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.w800, color: AppColorsDark.text),
        headlineMedium: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w700, color: AppColorsDark.text),
        titleLarge: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: AppColorsDark.text),
        titleMedium: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: AppColorsDark.text),
        titleSmall: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppColorsDark.text),
        bodyMedium: GoogleFonts.inter(fontSize: 14, color: AppColorsDark.text),
        bodySmall: GoogleFonts.inter(fontSize: 13, color: AppColorsDark.textSub),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColorsDark.surface,
        foregroundColor: AppColorsDark.text,
        elevation: 0,
        centerTitle: false,
        shadowColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColorsDark.text,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColorsDark.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_radius),
          side: const BorderSide(color: AppColorsDark.border),
        ),
        margin: EdgeInsets.zero,
      ),
      dividerTheme: const DividerThemeData(
        color: AppColorsDark.border,
        thickness: 1,
        space: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColorsDark.surfaceSecondary,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppColorsDark.text),
        hintStyle: GoogleFonts.inter(fontSize: 14, color: AppColorsDark.textMuted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radiusSm),
          borderSide: const BorderSide(color: AppColorsDark.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radiusSm),
          borderSide: const BorderSide(color: AppColorsDark.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radiusSm),
          borderSide: const BorderSide(color: AppColorsDark.accent, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColorsDark.btnBg,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 44),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusSm)),
          textStyle: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColorsDark.surface,
        selectedItemColor: AppColorsDark.accent,
        unselectedItemColor: AppColorsDark.textSub,
        selectedLabelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500),
        elevation: 0,
        type: BottomNavigationBarType.fixed,
      ),
      extensions: const [KarmenColors.dark],
    );
  }

  // ─── Helpers de decoración ──────────────────────────────────────────────────
  // Usa context.kc en los widgets en lugar de pasar dark:bool manualmente
  static BoxDecoration cardDecoration(KarmenColors c) => BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(_radius),
        border: Border.all(color: c.border),
        boxShadow: const [_shadow],
      );

  static BoxDecoration cardDecorationMd(KarmenColors c) => BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(_radius),
        border: Border.all(color: c.border),
        boxShadow: const [_shadowMd],
      );
}
