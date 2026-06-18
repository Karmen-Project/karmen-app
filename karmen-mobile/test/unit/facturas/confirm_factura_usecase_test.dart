import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:karmen/core/errors/failures.dart';
import 'package:karmen/features/facturas/domain/entities/factura.dart';
import 'package:karmen/features/facturas/domain/repositories/facturas_repository.dart';
import 'package:karmen/features/facturas/domain/usecases/confirm_factura_usecase.dart';
import 'package:mocktail/mocktail.dart';

class MockFacturasRepository extends Mock implements FacturasRepository {}

void main() {
  late ConfirmFacturaUseCase useCase;
  late MockFacturasRepository mockRepository;

  final tConfirmedFactura = Factura(
    id: 'f-1',
    type: 'INGRESO',
    status: 'confirmada',
    amount: 150000.0,
    currency: 'COP',
    issueDate: DateTime(2026, 1, 15),
    companyId: 'company-1',
  );

  setUp(() {
    mockRepository = MockFacturasRepository();
    useCase = ConfirmFacturaUseCase(mockRepository);
  });

  test('should return confirmed Factura on success', () async {
    when(() => mockRepository.confirmFactura(any()))
        .thenAnswer((_) async => Right(tConfirmedFactura));

    final result = await useCase('f-1');

    expect(result, Right(tConfirmedFactura));
    expect((result as Right).value.status, 'confirmada');
    verify(() => mockRepository.confirmFactura('f-1')).called(1);
  });

  test('should return ServerFailure when confirmation fails', () async {
    when(() => mockRepository.confirmFactura(any())).thenAnswer(
        (_) async => const Left(ServerFailure('Already confirmed')));

    final result = await useCase('f-1');

    expect(result, const Left(ServerFailure('Already confirmed')));
  });
}
