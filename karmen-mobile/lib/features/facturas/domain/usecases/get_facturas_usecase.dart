import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';

import '../../../../core/errors/failures.dart';
import '../entities/factura.dart';
import '../repositories/facturas_repository.dart';

class GetFacturasUseCase {
  final FacturasRepository _repository;
  const GetFacturasUseCase(this._repository);

  Future<Either<Failure, List<Factura>>> call(GetFacturasParams params) {
    return _repository.getFacturas(companyId: params.companyId);
  }
}

class GetFacturasParams extends Equatable {
  final String companyId;
  const GetFacturasParams({required this.companyId});

  @override
  List<Object> get props => [companyId];
}
