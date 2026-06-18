import 'package:dartz/dartz.dart';

import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/network/network_info.dart';
import '../../domain/entities/reporte.dart';
import '../../domain/repositories/reportes_repository.dart';
import '../datasources/reportes_remote_datasource.dart';

class ReportesRepositoryImpl implements ReportesRepository {
  final ReportesRemoteDataSource _remote;
  final NetworkInfo _networkInfo;

  const ReportesRepositoryImpl(this._remote, this._networkInfo);

  @override
  Future<Either<Failure, Reporte>> getMonthlyReport({
    required String companyId,
    required int year,
    required int month,
  }) async {
    if (!await _networkInfo.isConnected) return const Left(NetworkFailure());
    try {
      final reporte = await _remote.getMonthlyReport(
        companyId: companyId,
        year: year,
        month: month,
      );
      return Right(reporte);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on NetworkException {
      return const Left(NetworkFailure());
    }
  }
}
