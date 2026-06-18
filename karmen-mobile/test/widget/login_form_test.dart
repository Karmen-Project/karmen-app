import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:karmen/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:karmen/features/auth/presentation/bloc/auth_event.dart';
import 'package:karmen/features/auth/presentation/bloc/auth_state.dart';
import 'package:karmen/features/auth/presentation/widgets/login_form.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthBloc extends MockBloc<AuthEvent, AuthState> implements AuthBloc {}

void main() {
  late MockAuthBloc mockAuthBloc;

  setUp(() {
    mockAuthBloc = MockAuthBloc();
    when(() => mockAuthBloc.state).thenReturn(const AuthUnauthenticated());
  });

  Widget buildSubject() => MaterialApp(
        home: BlocProvider<AuthBloc>.value(
          value: mockAuthBloc,
          child: const Scaffold(body: LoginForm()),
        ),
      );

  testWidgets('renders email and password fields', (tester) async {
    await tester.pumpWidget(buildSubject());

    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.text('Correo electrónico'), findsOneWidget);
    expect(find.text('Contraseña'), findsOneWidget);
  });

  testWidgets('shows validation error for empty email', (tester) async {
    await tester.pumpWidget(buildSubject());

    await tester.tap(find.text('Iniciar sesión'));
    await tester.pump();

    expect(find.text('Ingresa tu correo'), findsOneWidget);
  });

  testWidgets('dispatches AuthLoginRequested with valid credentials',
      (tester) async {
    await tester.pumpWidget(buildSubject());

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Correo electrónico'),
      'user@karmen.com',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Contraseña'),
      'password123',
    );
    await tester.tap(find.text('Iniciar sesión'));
    await tester.pump();

    verify(() => mockAuthBloc.add(const AuthLoginRequested(
          email: 'user@karmen.com',
          password: 'password123',
        ))).called(1);
  });

  testWidgets('shows loading state when AuthLoading', (tester) async {
    when(() => mockAuthBloc.state).thenReturn(const AuthLoading());
    await tester.pumpWidget(buildSubject());

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
