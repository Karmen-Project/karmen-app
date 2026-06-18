import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';

import '../../../../core/errors/failures.dart';
import '../entities/reporte.dart';
import '../repositories/reportes_repository.dart';

class GetMonthlyReportUseCase {
  final ReportesRepository _repository;
  const GetMonthlyReportUseCase(this._repository);

  Future<Either<Failure, Reporte>> call(GetMonthlyReportParams params) {
    return _repository.getMonthlyReport(
      companyId: params.companyId,
      year: params.year,
      month: params.month,
    );
  }
}

class GetMonthlyReportParams extends Equatable {
  final String companyId;
  final int year;
  final int month;

  const GetMonthlyReportParams({
    required this.companyId,
    required this.year,
    required this.month,
  });

  @override
  List<Object> get props => [companyId, year, month];
}
