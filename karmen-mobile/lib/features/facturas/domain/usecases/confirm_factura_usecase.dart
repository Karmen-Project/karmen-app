import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/factura.dart';
import '../repositories/facturas_repository.dart';

class ConfirmFacturaUseCase {
  final FacturasRepository _repository;
  const ConfirmFacturaUseCase(this._repository);

  Future<Either<Failure, Factura>> call(String facturaId) {
    return _repository.confirmFactura(facturaId);
  }
}
