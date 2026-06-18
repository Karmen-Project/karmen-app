import 'dart:typed_data';

import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/factura.dart';
import '../entities/provider.dart';

abstract class FacturasRepository {
  Future<Either<Failure, List<Factura>>> getFacturas({required String companyId});
  Future<Either<Failure, Factura>> getFacturaById(String id);
  Future<Either<Failure, Factura>> uploadFactura({
    required String companyId,
    required String type,
    required Uint8List bytes,
    required String filename,
    String? providerId,
  });
  Future<Either<Failure, Factura>> confirmFactura(String id);
  Future<Either<Failure, Factura>> contabilizarFactura(String id);
  Future<Either<Failure, List<Provider>>> getProviders({required String companyId});
}
