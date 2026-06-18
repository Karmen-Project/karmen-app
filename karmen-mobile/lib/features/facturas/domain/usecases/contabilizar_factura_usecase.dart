import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/factura.dart';
import '../repositories/facturas_repository.dart';

class ContabilizarFacturaUseCase {
  final FacturasRepository _repository;
  const ContabilizarFacturaUseCase(this._repository);

  Future<Either<Failure, Factura>> call(String facturaId) {
    return _repository.contabilizarFactura(facturaId);
  }
}
