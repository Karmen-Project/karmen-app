import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/reporte.dart';

abstract class ReportesRepository {
  Future<Either<Failure, Reporte>> getMonthlyReport({
    required String companyId,
    required int year,
    required int month,
  });
}
