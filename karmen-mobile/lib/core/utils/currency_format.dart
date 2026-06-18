import 'package:intl/intl.dart';

/// Formato colombiano: "$9.500"  (símbolo antes, separador de miles con punto)
String formatCOP(double amount) {
  final number = NumberFormat('#,##0', 'es').format(amount);
  return '\$$number';
}

/// Formato compacto: "$9.5K"
String formatCOPCompact(double amount) {
  final number = NumberFormat.compact(locale: 'es').format(amount);
  return '\$$number';
}
