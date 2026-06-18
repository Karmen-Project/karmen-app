import 'dart:typed_data';

import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:karmen/core/errors/failures.dart';
import 'package:karmen/features/facturas/domain/entities/factura.dart';
import 'package:karmen/features/facturas/domain/repositories/facturas_repository.dart';
import 'package:karmen/features/facturas/domain/usecases/upload_factura_usecase.dart';
import 'package:mocktail/mocktail.dart';

class MockFacturasRepository extends Mock implements FacturasRepository {}

void main() {
  late UploadFacturaUseCase useCase;
  late MockFacturasRepository mockRepository;

  final tBytes = Uint8List.fromList([0, 1, 2, 3]);

  final tFactura = Factura(
    id: 'f-new',
    type: 'EGRESO',
    status: 'pendiente',
    amount: 80000.0,
    currency: 'COP',
    issueDate: DateTime(2026, 2, 1),
    companyId: 'company-1',
  );

  setUp(() {
    mockRepository = MockFacturasRepository();
    useCase = UploadFacturaUseCase(mockRepository);
  });

  test('should return uploaded Factura on success', () async {
    when(() => mockRepository.uploadFactura(
          companyId: any(named: 'companyId'),
          type: any(named: 'type'),
          bytes: any(named: 'bytes'),
          filename: any(named: 'filename'),
        )).thenAnswer((_) async => Right(tFactura));

    final result = await useCase(UploadFacturaParams(
      companyId: 'company-1',
      type: 'EGRESO',
      bytes: tBytes,
      filename: 'factura.jpg',
    ));

    expect(result, Right(tFactura));
  });

  test('should return ServerFailure when OCR processing fails', () async {
    when(() => mockRepository.uploadFactura(
              companyId: any(named: 'companyId'),
              type: any(named: 'type'),
              bytes: any(named: 'bytes'),
              filename: any(named: 'filename'),
            ))
        .thenAnswer(
            (_) async => const Left(ServerFailure('OCR processing failed')));

    final result = await useCase(UploadFacturaParams(
      companyId: 'company-1',
      type: 'INGRESO',
      bytes: tBytes,
      filename: 'bad.jpg',
    ));

    expect(result, const Left(ServerFailure('OCR processing failed')));
  });
}
