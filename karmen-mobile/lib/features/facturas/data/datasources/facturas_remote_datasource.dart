import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../models/factura_model.dart';
import '../models/provider_model.dart';

abstract class FacturasRemoteDataSource {
  Future<List<FacturaModel>> getFacturas({required String companyId});
  Future<FacturaModel> getFacturaById(String id);
  Future<FacturaModel> uploadFactura({
    required String companyId,
    required String type,
    required Uint8List bytes,
    required String filename,
    String? providerId,
  });
  Future<FacturaModel> confirmFactura(String id);
  Future<FacturaModel> contabilizarFactura(String id);
  Future<List<ProviderModel>> getProviders({required String companyId});
}

class FacturasRemoteDataSourceImpl implements FacturasRemoteDataSource {
  final ApiClient _client;
  const FacturasRemoteDataSourceImpl(this._client);

  @override
  Future<List<FacturaModel>> getFacturas({required String companyId}) async {
    final response = await _client.get(
      ApiEndpoints.invoices,
      params: {'companyId': companyId, 'size': 100},
    );
    final data = response.data;

    final List<dynamic> list;
    if (data is List) {
      list = data;
    } else if (data is Map) {
      final content = data['content'] ?? data['data'] ?? data['items'];
      list = content is List ? content : [];
    } else {
      list = [];
    }

    return list
        .whereType<Map<String, dynamic>>()
        .map(FacturaModel.fromJson)
        .toList();
  }

  @override
  Future<FacturaModel> getFacturaById(String id) async {
    final response = await _client.get(ApiEndpoints.invoiceById(id));
    if (response.data is! Map<String, dynamic>) {
      throw const ServerException('Formato de respuesta inesperado');
    }
    return FacturaModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<FacturaModel> uploadFactura({
    required String companyId,
    required String type,
    required Uint8List bytes,
    required String filename,
    String? providerId,
  }) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: filename),
    });
    // Timeout extendido: el OCR en Render puede tardar más de 30 segundos
    final params = {
      'companyId': companyId,
      'type': type,
      if (providerId != null) 'providerId': providerId,
    };
    final response = await _client.postFormDataSlow(
      ApiEndpoints.invoicesUpload,
      formData,
      params: params,
    );
    return FacturaModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<FacturaModel> confirmFactura(String id) async {
    final response = await _client.patch(ApiEndpoints.invoiceConfirm(id));
    return FacturaModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<FacturaModel> contabilizarFactura(String id) async {
    // Timeout extendido: el backend genera asientos contables con IA
    final response =
        await _client.postSlow(ApiEndpoints.invoiceContabilizar(id));
    return FacturaModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<List<ProviderModel>> getProviders({required String companyId}) async {
    final response = await _client.get(
      ApiEndpoints.providers,
      params: {'companyId': companyId},
    );
    final data = response.data;

    final List<dynamic> list;
    if (data is List) {
      list = data;
    } else if (data is Map) {
      final content = data['content'] ?? data['data'] ?? data['items'];
      list = content is List ? content : [];
    } else {
      list = [];
    }

    return list
        .whereType<Map<String, dynamic>>()
        .map(ProviderModel.fromJson)
        .toList();
  }
}
