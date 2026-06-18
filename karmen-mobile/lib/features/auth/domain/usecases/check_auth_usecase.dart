import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/session.dart';
import '../repositories/auth_repository.dart';

class CheckAuthUseCase {
  final AuthRepository _repository;
  const CheckAuthUseCase(this._repository);

  Future<Either<Failure, Session>> call() {
    return _repository.getSession();
  }
}
