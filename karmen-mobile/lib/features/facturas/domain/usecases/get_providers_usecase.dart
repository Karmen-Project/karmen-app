import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';

import '../../../../core/errors/failures.dart';
import '../entities/provider.dart';
import '../repositories/facturas_repository.dart';

class GetProvidersUseCase {
  final FacturasRepository _repository;
  const GetProvidersUseCase(this._repository);

  Future<Either<Failure, List<Provider>>> call(GetProvidersParams params) {
    return _repository.getProviders(companyId: params.companyId);
  }
}

class GetProvidersParams extends Equatable {
  final String companyId;
  const GetProvidersParams({required this.companyId});

  @override
  List<Object> get props => [companyId];
}
