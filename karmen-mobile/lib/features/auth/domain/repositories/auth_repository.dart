import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/session.dart';
import '../entities/user.dart';

abstract class AuthRepository {
  Future<Either<Failure, Session>> login(String email, String password);
  Future<Either<Failure, void>> logout();
  Future<Either<Failure, Session>> getSession();
  Future<Either<Failure, User>> getCurrentUser();
}
