class ServerException implements Exception {
  final String message;
  final int? statusCode;
  const ServerException(this.message, {this.statusCode});
}

class NetworkException implements Exception {
  final String message;
  const NetworkException([this.message = 'Sin conexión a internet']);
}

class CacheException implements Exception {
  final String message;
  const CacheException([this.message = 'Error en almacenamiento local']);
}

class AuthException implements Exception {
  final String message;
  const AuthException([this.message = 'No autenticado']);
}
