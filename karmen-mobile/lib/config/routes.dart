import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';

import '../core/di/injection.dart';
import '../core/widgets/main_scaffold.dart';
import '../features/auth/presentation/bloc/auth_bloc.dart';
import '../features/auth/presentation/bloc/auth_state.dart';
import '../features/auth/presentation/pages/login_page.dart';
import '../features/facturas/domain/entities/factura.dart';
import '../features/facturas/presentation/pages/facturas_page.dart';
import '../features/facturas/presentation/pages/factura_detail_page.dart';
import '../features/facturas/presentation/pages/upload_factura_page.dart';
import '../features/reportes/presentation/pages/reportes_page.dart';
import '../features/notifications/presentation/pages/notifications_page.dart';

class AppRouter {
  static final _authBloc = getIt<AuthBloc>();

  static final router = GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final authState = _authBloc.state;
      final isAuthenticated = authState is AuthAuthenticated;
      final isOnAuthRoute = state.matchedLocation == '/login';

      if (!isAuthenticated && !isOnAuthRoute) return '/login';
      if (isAuthenticated && isOnAuthRoute) return '/dashboard';
      return null;
    },
    refreshListenable: GoRouterRefreshStream(_authBloc.stream),
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      ShellRoute(
        builder: (context, state, child) => MainScaffold(
          location: state.matchedLocation,
          child: child,
        ),
        routes: [
          GoRoute(
            path: '/dashboard',
            name: 'dashboard',
            builder: (context, state) => const FacturasPage(),
            routes: [
              GoRoute(
                path: 'factura/:id',
                name: 'factura-detail',
                builder: (context, state) => FacturaDetailPage(
                  facturaId: state.pathParameters['id']!,
                  factura: state.extra as Factura?,
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/upload-factura',
            name: 'upload-factura',
            builder: (context, state) => const UploadFacturaPage(),
          ),
          GoRoute(
            path: '/reportes',
            name: 'reportes',
            builder: (context, state) => const ReportesPage(),
          ),
          GoRoute(
            path: '/notifications',
            name: 'notifications',
            builder: (context, state) => const NotificationsPage(),
          ),
        ],
      ),
    ],
  );
}

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream stream) {
    _subscription = stream.listen((_) => notifyListeners());
  }

  late final dynamic _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
