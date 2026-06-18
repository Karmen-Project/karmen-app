import 'package:equatable/equatable.dart';

class MonthlyDataPoint extends Equatable {
  final String month;
  final double ingresos;
  final double egresos;

  const MonthlyDataPoint({
    required this.month,
    required this.ingresos,
    required this.egresos,
  });

  @override
  List<Object> get props => [month, ingresos, egresos];
}

class Reporte extends Equatable {
  final double totalIncome;
  final double totalExpense;
  final double netBalance;
  final int invoiceCount;
  final List<MonthlyDataPoint> months;

  const Reporte({
    required this.totalIncome,
    required this.totalExpense,
    required this.netBalance,
    required this.invoiceCount,
    required this.months,
  });

  @override
  List<Object> get props => [totalIncome, totalExpense, netBalance, invoiceCount];
}
