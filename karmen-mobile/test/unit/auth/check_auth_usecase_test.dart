import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:karmen/core/errors/failures.dart';
import 'package:karmen/features/auth/domain/entities/session.dart';
import 'package:karmen/features/auth/domain/repositories/auth_repository.dart';
import 'package:karmen/features/auth/domain/usecases/check_auth_usecase.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late CheckAuthUseCase useCase;
  late MockAuthRepository mockRepository;

  final tSession = Session(
    token: 'valid-token',
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
    useCase = CheckAuthUseCase(mockRepository);
  });

  test('should return Session when valid session exists', () async {
    when(() => mockRepository.getSession())
        .thenAnswer((_) async => Right(tSession));

    final result = await useCase();

    expect(result, Right(tSession));
    verify(() => mockRepository.getSession()).called(1);
  });

  test('should return AuthFailure when no session stored', () async {
    when(() => mockRepository.getSession())
        .thenAnswer((_) async => const Left(AuthFailure()));

    final result = await useCase();

    expect(result, const Left(AuthFailure()));
  });

  test('should return AuthFailure when session is expired', () async {
    when(() => mockRepository.getSession())
        .thenAnswer((_) async => const Left(AuthFailure('Sesión expirada')));

    final result = await useCase();

    expect(result.isLeft(), true);
  });
}
