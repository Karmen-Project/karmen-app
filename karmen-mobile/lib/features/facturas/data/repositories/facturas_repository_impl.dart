import 'dart:typed_data';

import 'package:dartz/dartz.dart';

import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/network/network_info.dart';
import '../../domain/entities/factura.dart';
import '../../domain/entities/provider.dart';
import '../../domain/repositories/facturas_repository.dart';
import '../datasources/facturas_remote_datasource.dart';

class FacturasRepositoryImpl implements FacturasRepository {
  final FacturasRemoteDataSource _remote;
  final NetworkInfo _networkInfo;

  const FacturasRepositoryImpl(this._remote, this._networkInfo);

  @override
  Future<Either<Failure, List<Factura>>> getFacturas({
    required String companyId,
  }) async {
    if (!await _networkInfo.isConnected) return const Left(NetworkFailure());
    try {
      return Right(await _remote.getFacturas(companyId: companyId));
    } on AuthException {
      return const Left(AuthFailure('Sesión expirada'));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on NetworkException {
      return const Left(NetworkFailure());
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Factura>> getFacturaById(String id) async {
    if (!await _networkInfo.isConnected) return const Left(NetworkFailure());
    try {
      return Right(await _remote.getFacturaById(id));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Factura>> uploadFactura({
    required String companyId,
    required String type,
    required Uint8List bytes,
    required String filename,
    String? providerId,
  }) async {
    if (!await _networkInfo.isConnected) return const Left(NetworkFailure());
    try {
      return Right(await _remote.uploadFactura(
        companyId: companyId,
        type: type,
        bytes: bytes,
        filename: filename,
        providerId: providerId,
      ));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Factura>> confirmFactura(String id) async {
    if (!await _networkInfo.isConnected) return const Left(NetworkFailure());
    try {
      return Right(await _remote.confirmFactura(id));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Factura>> contabilizarFactura(String id) async {
    if (!await _networkInfo.isConnected) return const Left(NetworkFailure());
    try {
      return Right(await _remote.contabilizarFactura(id));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Provider>>> getProviders({
    required String companyId,
  }) async {
    if (!await _networkInfo.isConnected) return const Left(NetworkFailure());
    try {
      return Right(await _remote.getProviders(companyId: companyId));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
