import 'package:equatable/equatable.dart';

abstract class ReportesEvent extends Equatable {
  const ReportesEvent();
  @override
  List<Object?> get props => [];
}

class ReportesMonthlyRequested extends ReportesEvent {
  final String companyId;
  final int year;
  final int month;

  const ReportesMonthlyRequested({
    required this.companyId,
    required this.year,
    required this.month,
  });

  @override
  List<Object> get props => [companyId, year, month];
}
