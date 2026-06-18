import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/usecases/biometric_auth_usecase.dart';
import '../../domain/usecases/check_auth_usecase.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase loginUseCase;
  final LogoutUseCase logoutUseCase;
  final CheckAuthUseCase checkAuthUseCase;
  final BiometricAuthUseCase biometricAuthUseCase;

  AuthBloc({
    required this.loginUseCase,
    required this.logoutUseCase,
    required this.checkAuthUseCase,
    required this.biometricAuthUseCase,
  }) : super(const AuthInitial()) {
    on<AuthCheckRequested>(_onCheckRequested);
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthBiometricRequested>(_onBiometricRequested);
  }

  Future<void> _onCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final result = await checkAuthUseCase();
    result.fold(
      (_) => emit(const AuthUnauthenticated()),
      (session) => emit(AuthAuthenticated(session)),
    );
  }

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final result = await loginUseCase(
      LoginParams(email: event.email, password: event.password),
    );
    result.fold(
      (failure) => emit(AuthFailureState(failure.message)),
      (session) => emit(AuthAuthenticated(session)),
    );
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await logoutUseCase();
    emit(const AuthUnauthenticated());
  }

  Future<void> _onBiometricRequested(
    AuthBiometricRequested event,
    Emitter<AuthState> emit,
  ) async {
    final result = await biometricAuthUseCase();
    result.fold(
      (failure) => emit(AuthFailureState(failure.message)),
      (success) {
        if (!success) emit(const AuthFailureState('Biometría no disponible'));
      },
    );
  }
}
