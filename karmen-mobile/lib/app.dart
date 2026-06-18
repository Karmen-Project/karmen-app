import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config/routes.dart';
import 'core/di/injection.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';

class KarmenApp extends ConsumerWidget {
  const KarmenApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Singleton — misma instancia que usa AppRouter._authBloc
    final authBloc = getIt<AuthBloc>()..add(const AuthCheckRequested());

    return BlocProvider.value(
      value: authBloc,
      child: MaterialApp.router(
        title: 'Karmen',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.dark,
        routerConfig: AppRouter.router,
      ),
    );
  }
}
