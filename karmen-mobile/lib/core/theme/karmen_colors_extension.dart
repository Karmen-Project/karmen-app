import 'package:flutter/material.dart';

import 'app_colors.dart';

// Replica exacta del objeto T/TD del frontend karmen (src/utils/theme/index.js)
// Acceso: Theme.of(context).extension<KarmenColors>()!  o  context.kc
@immutable
class KarmenColors extends ThemeExtension<KarmenColors> {
  final Color bg;
  final Color surface;         // = T.white (cards, modals)
  final Color surfaceSecondary; // = T.surface (inputs, secondary bg)
  final Color border;
  final Color text;
  final Color textSub;         // = T.sub
  final Color textMuted;       // = T.muted
  final Color btnBg;           // = T.btn
  final Color accent;
  final Color accentLight;     // = T.accentLt
  final Color green;
  final Color greenLight;      // = T.greenLt
  final Color greenText;
  final Color red;
  final Color redLight;        // = T.redLt
  final Color redText;
  final Color orange;
  final Color orangeLight;     // = T.orangeLt
  final Color purple;
  final Color purpleLight;     // = T.purpleLt

  const KarmenColors({
    required this.bg,
    required this.surface,
    required this.surfaceSecondary,
    required this.border,
    required this.text,
    required this.textSub,
    required this.textMuted,
    required this.btnBg,
    required this.accent,
    required this.accentLight,
    required this.green,
    required this.greenLight,
    required this.greenText,
    required this.red,
    required this.redLight,
    required this.redText,
    required this.orange,
    required this.orangeLight,
    required this.purple,
    required this.purpleLight,
  });

  // ─── Tokens oscuros (únicos para esta app) ───────────────────────────────
  static const dark = KarmenColors(
    bg: AppColorsDark.bg,
    surface: AppColorsDark.surface,
    surfaceSecondary: AppColorsDark.surfaceSecondary,
    border: AppColorsDark.border,
    text: AppColorsDark.text,
    textSub: AppColorsDark.textSub,
    textMuted: AppColorsDark.textMuted,
    btnBg: AppColorsDark.btnBg,
    accent: AppColorsDark.accent,
    accentLight: AppColorsDark.accentLight,
    green: AppColorsDark.green,
    greenLight: AppColorsDark.greenLight,
    greenText: AppColorsDark.greenText,
    red: AppColorsDark.red,
    redLight: AppColorsDark.redLight,
    redText: AppColorsDark.redText,
    orange: AppColorsDark.orange,
    orangeLight: AppColorsDark.orangeLight,
    purple: AppColorsDark.purple,
    purpleLight: AppColorsDark.purpleLight,
  );

  @override
  KarmenColors copyWith({
    Color? bg, Color? surface, Color? surfaceSecondary, Color? border,
    Color? text, Color? textSub, Color? textMuted, Color? btnBg,
    Color? accent, Color? accentLight,
    Color? green, Color? greenLight, Color? greenText,
    Color? red, Color? redLight, Color? redText,
    Color? orange, Color? orangeLight,
    Color? purple, Color? purpleLight,
  }) => KarmenColors(
    bg: bg ?? this.bg,
    surface: surface ?? this.surface,
    surfaceSecondary: surfaceSecondary ?? this.surfaceSecondary,
    border: border ?? this.border,
    text: text ?? this.text,
    textSub: textSub ?? this.textSub,
    textMuted: textMuted ?? this.textMuted,
    btnBg: btnBg ?? this.btnBg,
    accent: accent ?? this.accent,
    accentLight: accentLight ?? this.accentLight,
    green: green ?? this.green,
    greenLight: greenLight ?? this.greenLight,
    greenText: greenText ?? this.greenText,
    red: red ?? this.red,
    redLight: redLight ?? this.redLight,
    redText: redText ?? this.redText,
    orange: orange ?? this.orange,
    orangeLight: orangeLight ?? this.orangeLight,
    purple: purple ?? this.purple,
    purpleLight: purpleLight ?? this.purpleLight,
  );

  @override
  KarmenColors lerp(KarmenColors? other, double t) {
    if (other == null) return this;
    return KarmenColors(
      bg: Color.lerp(bg, other.bg, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceSecondary: Color.lerp(surfaceSecondary, other.surfaceSecondary, t)!,
      border: Color.lerp(border, other.border, t)!,
      text: Color.lerp(text, other.text, t)!,
      textSub: Color.lerp(textSub, other.textSub, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      btnBg: Color.lerp(btnBg, other.btnBg, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      accentLight: Color.lerp(accentLight, other.accentLight, t)!,
      green: Color.lerp(green, other.green, t)!,
      greenLight: Color.lerp(greenLight, other.greenLight, t)!,
      greenText: Color.lerp(greenText, other.greenText, t)!,
      red: Color.lerp(red, other.red, t)!,
      redLight: Color.lerp(redLight, other.redLight, t)!,
      redText: Color.lerp(redText, other.redText, t)!,
      orange: Color.lerp(orange, other.orange, t)!,
      orangeLight: Color.lerp(orangeLight, other.orangeLight, t)!,
      purple: Color.lerp(purple, other.purple, t)!,
      purpleLight: Color.lerp(purpleLight, other.purpleLight, t)!,
    );
  }
}

// Acceso rápido: context.kc.bg  →  igual que T.bg en el frontend
extension KarmenColorsContext on BuildContext {
  KarmenColors get kc => Theme.of(this).extension<KarmenColors>()!;
}
