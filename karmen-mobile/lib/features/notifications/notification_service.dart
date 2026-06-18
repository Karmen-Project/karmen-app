import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import 'fcm_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('Background message: ${message.messageId}');
}

class NotificationService {
  NotificationService._();
  static final instance = NotificationService._();

  late final FcmService _fcmService;

  Future<void> initialize() async {
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    _fcmService = FcmService();
    await _fcmService.initialize();
    _setupForegroundHandler();
  }

  void _setupForegroundHandler() {
    FirebaseMessaging.onMessage.listen((message) {
      final notification = message.notification;
      if (notification != null) {
        debugPrint('Foreground notification: ${notification.title}');
      }
    });
  }

  Future<String?> getToken() => _fcmService.getToken();
}
