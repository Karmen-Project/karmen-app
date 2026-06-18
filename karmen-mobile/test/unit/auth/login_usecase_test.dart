import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:karmen/core/errors/failures.dart';
import 'package:karmen/features/auth/domain/entities/session.dart';
import 'package:karmen/features/auth/domain/repositories/auth_repository.dart';
import 'package:karmen/features/auth/domain/usecases/login_usecase.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late LoginUseCase useCase;
  late MockAuthRepository mockRepository;

  final tSession = Session(
    token: 'test-token',
    userId: 'user-1',
    email: 'test@karmen.com',
    fullName: 'Test User',
    role: 'ADMIN',
    companyId: 'company-1',
    companyName: 'Test Company',
    expiration: DateTime.now().add(const Duration(hours: 24)),
  );

  setUp(() {
    mockRepository = MockAuthRepository();
    useCase = LoginUseCase(mockRepository);
  });

  test('should return Session when login succeeds', () async {
    when(() => mockRepository.login(any(), any()))
        .thenAnswer((_) async => Right(tSession));

    final result = await useCase(
      const LoginParams(email: 'test@karmen.com', password: 'password123'),
    );

    expect(result, Right(tSession));
    verify(() => mockRepository.login('test@karmen.com', 'password123'))
        .called(1);
  });

  test('should return AuthFailure on wrong credentials', () async {
    when(() => mockRepository.login(any(), any())).thenAnswer(
        (_) async => const Left(AuthFailure('Credenciales inválidas')));

    final result = await useCase(
      const LoginParams(email: 'wrong@karmen.com', password: 'bad'),
    );

    expect(result, const Left(AuthFailure('Credenciales inválidas')));
  });

  test('should return NetworkFailure when offline', () async {
    when(() => mockRepository.login(any(), any()))
        .thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await useCase(
      const LoginParams(email: 'test@karmen.com', password: 'password123'),
    );

    expect(result, const Left(NetworkFailure()));
  });
}
