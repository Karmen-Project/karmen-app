import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app.dart';
import 'core/di/injection.dart';
import 'features/notifications/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');
  await initializeDateFormatting('es', null);

  // Firebase solo disponible en Android/iOS/Web con google-services configurado
  try {
    await Firebase.initializeApp();
    await NotificationService.instance.initialize();
  } catch (_) {}

  await configureDependencies();
  runApp(const ProviderScope(child: KarmenApp()));
}
