class ApiEndpoints {
  static const String login = 'auth/login';
  static const String register = 'auth/register';

  static const String invoices = 'invoices';
  static String invoiceById(String id) => 'invoices/$id';
  static String invoiceConfirm(String id) => 'invoices/$id/confirm';
  static String invoiceContabilizar(String id) => 'invoices/$id/contabilizar';
  static String invoiceHistory(String id) => 'invoices/$id/history';
  static const String invoicesUpload = 'invoices/upload';

  static const String providers = 'providers';
  static String providerById(String id) => 'providers/$id';

  static const String accounts = 'accounts';
  static String accountById(String id) => 'accounts/$id';

  static const String reportMonthly = 'reports/monthly';
  static const String reportRange = 'reports/range';

  static const String userMe = 'users/me';
  static String company(String id) => 'companies/$id';
}
