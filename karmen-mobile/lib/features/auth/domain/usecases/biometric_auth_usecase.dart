import 'package:dartz/dartz.dart';
import 'package:local_auth/local_auth.dart';

import '../../../../core/errors/failures.dart';

class BiometricAuthUseCase {
  final LocalAuthentication _auth = LocalAuthentication();

  Future<Either<Failure, bool>> call() async {
    try {
      final isAvailable = await _auth.canCheckBiometrics;
      if (!isAvailable) return const Right(false);

      final authenticated = await _auth.authenticate(
        localizedReason: 'Confirma tu identidad para acceder a Karmen',
        options: const AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
        ),
      );
      return Right(authenticated);
    } catch (e) {
      return Left(BiometricFailure(e.toString()));
    }
  }
}
