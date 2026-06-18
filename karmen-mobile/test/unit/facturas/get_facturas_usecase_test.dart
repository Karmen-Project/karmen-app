import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:karmen/core/errors/failures.dart';
import 'package:karmen/features/facturas/domain/entities/factura.dart';
import 'package:karmen/features/facturas/domain/repositories/facturas_repository.dart';
import 'package:karmen/features/facturas/domain/usecases/get_facturas_usecase.dart';
import 'package:mocktail/mocktail.dart';

class MockFacturasRepository extends Mock implements FacturasRepository {}

void main() {
  late GetFacturasUseCase useCase;
  late MockFacturasRepository mockRepository;

  final tFactura = Factura(
    id: 'f-1',
    type: 'INGRESO',
    status: 'PENDIENTE',
    amount: 150000.0,
    currency: 'COP',
    issueDate: DateTime(2026, 1, 15),
    companyId: 'company-1',
  );

  setUp(() {
    mockRepository = MockFacturasRepository();
    useCase = GetFacturasUseCase(mockRepository);
  });

  test('should return list of facturas for a company', () async {
    when(() => mockRepository.getFacturas(companyId: any(named: 'companyId')))
        .thenAnswer((_) async => Right([tFactura]));

    final result =
        await useCase(const GetFacturasParams(companyId: 'company-1'));

    expect(result, Right([tFactura]));
    verify(() => mockRepository.getFacturas(companyId: 'company-1')).called(1);
  });

  test('should return NetworkFailure when offline', () async {
    when(() => mockRepository.getFacturas(companyId: any(named: 'companyId')))
        .thenAnswer((_) async => const Left(NetworkFailure()));

    final result =
        await useCase(const GetFacturasParams(companyId: 'company-1'));

    expect(result, const Left(NetworkFailure()));
  });
}
