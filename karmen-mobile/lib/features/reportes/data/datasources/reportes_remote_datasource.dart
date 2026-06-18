import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/reporte_model.dart';

abstract class ReportesRemoteDataSource {
  Future<ReporteModel> getMonthlyReport({
    required String companyId,
    required int year,
    required int month,
  });
}

class ReportesRemoteDataSourceImpl implements ReportesRemoteDataSource {
  final ApiClient _client;
  const ReportesRemoteDataSourceImpl(this._client);

  @override
  Future<ReporteModel> getMonthlyReport({
    required String companyId,
    required int year,
    required int month,
  }) async {
    final response = await _client.get(
      ApiEndpoints.reportMonthly,
      params: {'companyId': companyId, 'year': year, 'month': month},
    );
    return ReporteModel.fromJson(response.data as Map<String, dynamic>);
  }
}
