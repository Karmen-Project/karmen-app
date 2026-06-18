class AppConstants {
  static const String tokenKey = 'auth_token';
  static const String sessionKey = 'auth_session';
  static const int tokenExpirationHours = 24;

  static const String roleAdmin = 'ADMIN';
  static const String roleContador = 'CONTADOR';

  static const String invoiceStatusPendiente = 'pendiente';
  static const String invoiceStatusConfirmada = 'confirmada';
  static const String invoiceStatusContabilizada = 'contabilizada';

  static const String invoiceTypeIngreso = 'INGRESO';
  static const String invoiceTypeEgreso = 'EGRESO';
}
