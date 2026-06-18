import '../../../../core/storage/secure_storage.dart';
import '../../domain/entities/session.dart';
import '../models/session_model.dart';

abstract class AuthLocalDataSource {
  Future<void> saveSession(SessionModel session);
  Future<Session?> getSession();
  Future<void> clearSession();
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  final SecureStorage _storage;
  const AuthLocalDataSourceImpl(this._storage);

  @override
  Future<void> saveSession(SessionModel session) => _storage.saveSession(session);

  @override
  Future<Session?> getSession() => _storage.getSession();

  @override
  Future<void> clearSession() => _storage.clearSession();
}
