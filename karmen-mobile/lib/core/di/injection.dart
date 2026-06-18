import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';

import '../network/api_client.dart';
import '../network/network_info.dart';
import '../storage/secure_storage.dart';
import '../../features/auth/data/datasources/auth_local_datasource.dart';
import '../../features/auth/data/datasources/auth_remote_datasource.dart';
import '../../features/auth/data/repositories/auth_repository_impl.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/auth/domain/usecases/login_usecase.dart';
import '../../features/auth/domain/usecases/logout_usecase.dart';
import '../../features/auth/domain/usecases/check_auth_usecase.dart';
import '../../features/auth/domain/usecases/biometric_auth_usecase.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/facturas/data/datasources/facturas_remote_datasource.dart';
import '../../features/facturas/data/repositories/facturas_repository_impl.dart';
import '../../features/facturas/domain/repositories/facturas_repository.dart';
import '../../features/facturas/domain/usecases/get_facturas_usecase.dart';
import '../../features/facturas/domain/usecases/get_providers_usecase.dart';
import '../../features/facturas/domain/usecases/upload_factura_usecase.dart';
import '../../features/facturas/domain/usecases/confirm_factura_usecase.dart';
import '../../features/facturas/domain/usecases/contabilizar_factura_usecase.dart';
import '../../features/facturas/presentation/bloc/facturas_bloc.dart';
import '../../features/reportes/data/datasources/reportes_remote_datasource.dart';
import '../../features/reportes/data/repositories/reportes_repository_impl.dart';
import '../../features/reportes/domain/repositories/reportes_repository.dart';
import '../../features/reportes/domain/usecases/get_monthly_report_usecase.dart';
import '../../features/reportes/presentation/bloc/reportes_bloc.dart';

final getIt = GetIt.instance;

Future<void> configureDependencies() async {
  // External
  getIt.registerLazySingleton(() => const FlutterSecureStorage());
  getIt.registerLazySingleton(() => Connectivity());

  // Core
  getIt.registerLazySingleton(() => SecureStorage(getIt()));
  getIt.registerLazySingleton<NetworkInfo>(() => NetworkInfoImpl(getIt()));
  getIt.registerLazySingleton(() => ApiClient(getIt()));

  // Auth - Data
  getIt.registerLazySingleton<AuthRemoteDataSource>(() => AuthRemoteDataSourceImpl(getIt()));
  getIt.registerLazySingleton<AuthLocalDataSource>(() => AuthLocalDataSourceImpl(getIt()));
  getIt.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(getIt(), getIt(), getIt()),
  );

  // Auth - Domain
  getIt.registerLazySingleton(() => LoginUseCase(getIt()));
  getIt.registerLazySingleton(() => LogoutUseCase(getIt()));
  getIt.registerLazySingleton(() => CheckAuthUseCase(getIt()));
  getIt.registerLazySingleton(() => BiometricAuthUseCase());

  // Auth - Presentation
  getIt.registerLazySingleton(() => AuthBloc(
        loginUseCase: getIt(),
        logoutUseCase: getIt(),
        checkAuthUseCase: getIt(),
        biometricAuthUseCase: getIt(),
      ));

  // Facturas - Data
  getIt.registerLazySingleton<FacturasRemoteDataSource>(
    () => FacturasRemoteDataSourceImpl(getIt()),
  );
  getIt.registerLazySingleton<FacturasRepository>(
    () => FacturasRepositoryImpl(getIt(), getIt()),
  );

  // Facturas - Domain
  getIt.registerLazySingleton(() => GetFacturasUseCase(getIt()));
  getIt.registerLazySingleton(() => GetProvidersUseCase(getIt()));
  getIt.registerLazySingleton(() => UploadFacturaUseCase(getIt()));
  getIt.registerLazySingleton(() => ConfirmFacturaUseCase(getIt()));
  getIt.registerLazySingleton(() => ContabilizarFacturaUseCase(getIt()));

  // Facturas - Presentation
  getIt.registerFactory(() => FacturasBloc(
        getFacturasUseCase: getIt(),
        getProvidersUseCase: getIt(),
        uploadFacturaUseCase: getIt(),
        confirmFacturaUseCase: getIt(),
        contabilizarFacturaUseCase: getIt(),
      ));

  // Reportes - Data
  getIt.registerLazySingleton<ReportesRemoteDataSource>(
    () => ReportesRemoteDataSourceImpl(getIt()),
  );
  getIt.registerLazySingleton<ReportesRepository>(
    () => ReportesRepositoryImpl(getIt(), getIt()),
  );

  // Reportes - Domain
  getIt.registerLazySingleton(() => GetMonthlyReportUseCase(getIt()));

  // Reportes - Presentation
  getIt.registerFactory(() => ReportesBloc(getMonthlyReportUseCase: getIt()));
}
