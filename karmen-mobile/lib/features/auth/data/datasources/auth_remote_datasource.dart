import '../../../../core/constants/api_constants.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../models/session_model.dart';

abstract class AuthRemoteDataSource {
  Future<SessionModel> login(String email, String password);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient _client;
  const AuthRemoteDataSourceImpl(this._client);

  @override
  Future<SessionModel> login(String email, String password) async {
    final response = await _client.post(
      ApiEndpoints.login,
      data: {'email': email, 'password': password},
    );
    if (response.data == null) {
      throw const ServerException('Respuesta vacía del servidor');
    }
    return SessionModel.fromLoginResponse(response.data as Map<String, dynamic>);
  }
}
