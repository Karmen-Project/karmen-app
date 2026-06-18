import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:karmen/features/auth/domain/repositories/auth_repository.dart';
import 'package:karmen/features/auth/domain/usecases/logout_usecase.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late LogoutUseCase useCase;
  late MockAuthRepository mockRepository;

  setUp(() {
    mockRepository = MockAuthRepository();
    useCase = LogoutUseCase(mockRepository);
  });

  test('should clear session and return void on logout', () async {
    when(() => mockRepository.logout())
        .thenAnswer((_) async => const Right(null));

    final result = await useCase();

    expect(result, const Right(null));
    verify(() => mockRepository.logout()).called(1);
  });
}
