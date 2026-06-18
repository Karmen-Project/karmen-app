import '../../domain/entities/reporte.dart';

class MonthlyDataPointModel extends MonthlyDataPoint {
  const MonthlyDataPointModel({
    required super.month,
    required super.ingresos,
    required super.egresos,
  });

  factory MonthlyDataPointModel.fromJson(Map<String, dynamic> json) =>
      MonthlyDataPointModel(
        month: json['mes']?.toString() ?? json['month']?.toString() ?? '',
        ingresos: (json['ingresos'] as num?)?.toDouble() ?? 0.0,
        egresos: (json['egresos'] as num?)?.toDouble() ?? 0.0,
      );
}

class ReporteModel extends Reporte {
  const ReporteModel({
    required super.totalIncome,
    required super.totalExpense,
    required super.netBalance,
    required super.invoiceCount,
    required super.months,
  });

  factory ReporteModel.fromJson(Map<String, dynamic> json) {
    final totalIncome = (json['totalIncome'] ?? json['total_income'] ?? json['totalIngresos'] ?? json['total_ingresos'] as num?)?.toDouble() ?? 0.0;
    final totalExpense = (json['totalExpense'] ?? json['total_expense'] ?? json['totalEgresos'] ?? json['total_egresos'] as num?)?.toDouble() ?? 0.0;
    final netBalance = (json['netBalance'] ?? json['net_balance'] ?? json['balanceNeto'] ?? json['balance_neto'] as num?)?.toDouble() ?? 0.0;

    return ReporteModel(
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      netBalance: netBalance,
      invoiceCount: (json['invoiceCount'] ?? json['invoice_count'] as num?)?.toInt() ?? 0,
      months: ((json['months'] ?? json['data'] ?? []) as List<dynamic>)
          .whereType<Map<String, dynamic>>()
          .map(MonthlyDataPointModel.fromJson)
          .toList(),
    );
  }
}
