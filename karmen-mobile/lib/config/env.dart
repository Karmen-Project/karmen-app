import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'http://localhost:8080/api/';
  static String get appName => dotenv.env['APP_NAME'] ?? 'Karmen';
}
