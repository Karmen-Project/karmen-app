import '../../domain/entities/factura.dart';

class FacturaModel extends Factura {
  const FacturaModel({
    required super.id,
    required super.type,
    required super.status,
    super.providerId,
    super.providerName,
    required super.amount,
    required super.currency,
    required super.issueDate,
    super.description,
    super.fileUrl,
    required super.companyId,
    super.taxId,
    super.paymentMethod,
  });

  factory FacturaModel.fromJson(Map<String, dynamic> json) => FacturaModel(
        id: json['id']?.toString() ?? '',
        type: json['type']?.toString() ?? 'INGRESO',
        status: json['status']?.toString() ?? 'PENDIENTE',
        providerId: json['providerId']?.toString(),
        providerName: json['providerName']?.toString(),
        // El backend devuelve "total" como monto principal
        amount: (json['total'] as num?)?.toDouble() ??
            (json['amount'] as num?)?.toDouble() ??
            0.0,
        currency: json['currency']?.toString() ?? 'COP',
        // El backend devuelve "invoiceDate" (YYYY-MM-DD)
        issueDate: _parseDate(json['invoiceDate'] ?? json['issueDate']),
        description: json['notes']?.toString() ?? json['description']?.toString(),
        fileUrl: json['fileUrl']?.toString(),
        companyId: json['companyId']?.toString() ?? '',
        taxId: json['taxId']?.toString(),
        paymentMethod: json['paymentMethod']?.toString(),
      );

  static DateTime _parseDate(dynamic value) {
    if (value == null) return DateTime.now();
    try {
      return DateTime.parse(value.toString());
    } catch (_) {
      return DateTime.now();
    }
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'status': status,
        'providerId': providerId,
        'total': amount,
        'currency': currency,
        'invoiceDate': issueDate.toIso8601String(),
        'notes': description,
        'fileUrl': fileUrl,
        'companyId': companyId,
        'taxId': taxId,
        'paymentMethod': paymentMethod,
      };
}
