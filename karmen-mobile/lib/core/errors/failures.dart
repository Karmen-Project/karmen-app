import 'package:equatable/equatable.dart';

abstract class Failure extends Equatable {
  final String message;
  const Failure(this.message);

  @override
  List<Object> get props => [message];
}

class ServerFailure extends Failure {
  const ServerFailure(super.message);
}

class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'Sin conexión a internet']);
}

class CacheFailure extends Failure {
  const CacheFailure([super.message = 'Error en almacenamiento local']);
}

class AuthFailure extends Failure {
  const AuthFailure([super.message = 'No autenticado']);
}

class BiometricFailure extends Failure {
  const BiometricFailure([super.message = 'Error en autenticación biométrica']);
}
