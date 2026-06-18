import 'package:dartz/dartz.dart';

import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/network/network_info.dart';
import '../../domain/entities/session.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_datasource.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remote;
  final AuthLocalDataSource _local;
  final NetworkInfo _networkInfo;

  const AuthRepositoryImpl(this._remote, this._local, this._networkInfo);

  @override
  Future<Either<Failure, Session>> login(String email, String password) async {
    if (!await _networkInfo.isConnected) {
      return const Left(NetworkFailure());
    }
    try {
      final session = await _remote.login(email, password);
      await _local.saveSession(session);
      return Right(session);
    } on AuthException catch (e) {
      return Left(AuthFailure(e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on NetworkException {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await _local.clearSession();
      return const Right(null);
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    }
  }

  @override
  Future<Either<Failure, Session>> getSession() async {
    try {
      final session = await _local.getSession();
      if (session == null) return const Left(AuthFailure());
      return Right(session);
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    }
  }

  @override
  Future<Either<Failure, User>> getCurrentUser() async {
    final sessionResult = await getSession();
    return sessionResult.fold(
      Left.new,
      (session) => Right(UserModel(
        id: session.userId,
        email: session.email,
        fullName: session.fullName,
        role: session.role,
        companyId: session.companyId,
        companyName: session.companyName,
      )),
    );
  }
}
