import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:karmen/features/facturas/domain/entities/factura.dart';
import 'package:karmen/features/facturas/presentation/widgets/factura_card.dart';

void main() {
  final tFactura = Factura(
    id: 'f-1',
    type: 'INGRESO',
    status: 'pendiente',
    amount: 150000.0,
    currency: 'COP',
    issueDate: DateTime(2026, 1, 15),
    companyId: 'company-1',
  );

  Widget buildSubject({VoidCallback? onTap}) => MaterialApp(
        home: Scaffold(
          body: FacturaCard(factura: tFactura, onTap: onTap ?? () {}),
        ),
      );

  testWidgets('renders factura type and status', (tester) async {
    await tester.pumpWidget(buildSubject());

    expect(find.text('INGRESO'), findsOneWidget);
    expect(find.text('pendiente'), findsOneWidget);
  });

  testWidgets('calls onTap when tapped', (tester) async {
    var tapped = false;
    await tester.pumpWidget(buildSubject(onTap: () => tapped = true));

    await tester.tap(find.byType(InkWell));
    expect(tapped, true);
  });

  testWidgets('shows ingreso icon for income factura', (tester) async {
    await tester.pumpWidget(buildSubject());

    expect(find.byIcon(Icons.arrow_downward), findsOneWidget);
  });
}
