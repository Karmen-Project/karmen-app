import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

abstract class NetworkInfo {
  Future<bool> get isConnected;
}

class NetworkInfoImpl implements NetworkInfo {
  final Connectivity _connectivity;
  NetworkInfoImpl(this._connectivity);

  @override
  Future<bool> get isConnected async {
    // connectivity_plus no es fiable en web — asumimos conexión y dejamos
    // que Dio maneje los errores de red directamente.
    if (kIsWeb) return true;
    final results = await _connectivity.checkConnectivity();
    return results.any((r) => r != ConnectivityResult.none);
  }
}
