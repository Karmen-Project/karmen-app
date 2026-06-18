import 'package:dio/dio.dart';

import '../errors/exceptions.dart';
import '../storage/secure_storage.dart';
import '../../config/env.dart';

class ApiClient {
  late final Dio _dio;
  final SecureStorage _storage;

  ApiClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );
    _dio.interceptors.add(_AuthInterceptor(_storage));
    _dio.interceptors.add(LogInterceptor(responseBody: true));
  }

  Future<Response> get(String path, {Map<String, dynamic>? params}) async {
    try {
      return await _dio.get(path, queryParameters: params);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? params}) async {
    try {
      return await _dio.post(path, data: data, queryParameters: params);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// POST con timeout extendido para operaciones que procesan IA/asientos contables
  Future<Response> postSlow(String path,
      {dynamic data, Map<String, dynamic>? params}) async {
    try {
      return await _dio.post(
        path,
        data: data,
        queryParameters: params,
        options: Options(
          sendTimeout: const Duration(seconds: 120),
          receiveTimeout: const Duration(seconds: 120),
        ),
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response> patch(String path, {dynamic data}) async {
    try {
      return await _dio.patch(path, data: data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response> delete(String path) async {
    try {
      return await _dio.delete(path);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response> postFormData(String path, FormData data,
      {Map<String, dynamic>? params}) async {
    try {
      return await _dio.post(path, data: data, queryParameters: params);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Upload con timeout extendido para OCR (puede tardar en Render)
  Future<Response> postFormDataSlow(String path, FormData data,
      {Map<String, dynamic>? params}) async {
    try {
      return await _dio.post(
        path,
        data: data,
        queryParameters: params,
        options: Options(
          sendTimeout: const Duration(seconds: 180),
          receiveTimeout: const Duration(seconds: 180),
        ),
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Exception _handleDioError(DioException e) {
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return const NetworkException('El servidor tardó demasiado en responder');
    }
    final statusCode = e.response?.statusCode;
    final data = e.response?.data;
    final message = data is Map
        ? (data['detail'] ?? data['message'] ?? data['error'] ??
            'Error $statusCode')
        : 'Error del servidor';
    if (statusCode == 401) return const AuthException('Sesión expirada');
    return ServerException(message.toString(), statusCode: statusCode);
  }
}

class _AuthInterceptor extends Interceptor {
  final SecureStorage _storage;
  _AuthInterceptor(this._storage);

  @override
  void onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    super.onRequest(options, handler);
  }
}
