import 'package:equatable/equatable.dart';

import '../../domain/entities/reporte.dart';

abstract class ReportesState extends Equatable {
  const ReportesState();
  @override
  List<Object?> get props => [];
}

class ReportesInitial extends ReportesState {
  const ReportesInitial();
}

class ReportesLoading extends ReportesState {
  const ReportesLoading();
}

class ReportesLoaded extends ReportesState {
  final Reporte reporte;
  const ReportesLoaded(this.reporte);

  @override
  List<Object> get props => [reporte];
}

class ReportesError extends ReportesState {
  final String message;
  const ReportesError(this.message);

  @override
  List<Object> get props => [message];
}
