import 'package:equatable/equatable.dart';

class Factura extends Equatable {
  final String id;
  final String type;
  final String status;
  final String? providerId;
  final String? providerName;
  final double amount;
  final String currency;
  final DateTime issueDate;
  final String? description;
  final String? fileUrl;
  final String companyId;
  final String? taxId;
  final String? paymentMethod;

  const Factura({
    required this.id,
    required this.type,
    required this.status,
    this.providerId,
    this.providerName,
    required this.amount,
    required this.currency,
    required this.issueDate,
    this.description,
    this.fileUrl,
    required this.companyId,
    this.taxId,
    this.paymentMethod,
  });

  // El backend devuelve status en mayúsculas (PENDIENTE, CONFIRMADA, etc.)
  bool get isPendiente => status.toUpperCase() == 'PENDIENTE';
  bool get isConfirmada => status.toUpperCase() == 'CONFIRMADA';
  bool get isContabilizada => status.toUpperCase() == 'CONTABILIZADA';
  bool get isIngreso => type.toUpperCase() == 'INGRESO';

  @override
  List<Object?> get props =>
      [id, type, status, amount, currency, issueDate, taxId, paymentMethod];
}
