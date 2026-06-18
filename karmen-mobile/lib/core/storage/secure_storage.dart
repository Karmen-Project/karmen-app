import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/app_constants.dart';
import '../../features/auth/domain/entities/session.dart';

class SecureStorage {
  final FlutterSecureStorage _storage;

  SecureStorage(this._storage);

  Future<void> saveSession(Session session) async {
    await _storage.write(
      key: AppConstants.sessionKey,
      value: jsonEncode(session.toJson()),
    );
  }

  Future<Session?> getSession() async {
    final raw = await _storage.read(key: AppConstants.sessionKey);
    if (raw == null) return null;
    final map = jsonDecode(raw) as Map<String, dynamic>;
    final session = Session.fromJson(map);
    if (session.isExpired) {
      await clearSession();
      return null;
    }
    return session;
  }

  Future<String?> getToken() async {
    final session = await getSession();
    return session?.token;
  }

  Future<void> clearSession() async {
    await _storage.delete(key: AppConstants.sessionKey);
  }
}
