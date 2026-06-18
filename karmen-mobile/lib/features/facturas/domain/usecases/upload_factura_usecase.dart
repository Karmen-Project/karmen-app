import 'dart:typed_data';

import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';

import '../../../../core/errors/failures.dart';
import '../entities/factura.dart';
import '../repositories/facturas_repository.dart';

class UploadFacturaUseCase {
  final FacturasRepository _repository;
  const UploadFacturaUseCase(this._repository);

  Future<Either<Failure, Factura>> call(UploadFacturaParams params) {
    return _repository.uploadFactura(
      companyId: params.companyId,
      type: params.type,
      bytes: params.bytes,
      filename: params.filename,
      providerId: params.providerId,
    );
  }
}

class UploadFacturaParams extends Equatable {
  final String companyId;
  final String type;
  final Uint8List bytes;
  final String filename;
  final String? providerId;

  const UploadFacturaParams({
    required this.companyId,
    required this.type,
    required this.bytes,
    required this.filename,
    this.providerId,
  });

  @override
  List<Object?> get props => [companyId, type, filename, providerId];
}
