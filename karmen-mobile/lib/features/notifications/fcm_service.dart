import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

class FcmService {
  final _messaging = FirebaseMessaging.instance;

  Future<void> initialize() async {
    // Request permission (iOS / web)
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('FCM permission granted');
    }

    // OWASP M1 - Improper Platform Usage: use secure APNs token on iOS
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  Future<String?> getToken() async {
    try {
      return await _messaging.getToken();
    } catch (e) {
      debugPrint('FCM token error: $e');
      return null;
    }
  }
}
