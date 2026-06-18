import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/provider.dart';
import '../../domain/usecases/confirm_factura_usecase.dart';
import '../../domain/usecases/contabilizar_factura_usecase.dart';
import '../../domain/usecases/get_facturas_usecase.dart';
import '../../domain/usecases/get_providers_usecase.dart';
import '../../domain/usecases/upload_factura_usecase.dart';
import 'facturas_event.dart';
import 'facturas_state.dart';

class FacturasBloc extends Bloc<FacturasEvent, FacturasState> {
  final GetFacturasUseCase getFacturasUseCase;
  final GetProvidersUseCase getProvidersUseCase;
  final UploadFacturaUseCase uploadFacturaUseCase;
  final ConfirmFacturaUseCase confirmFacturaUseCase;
  final ContabilizarFacturaUseCase contabilizarFacturaUseCase;

  FacturasBloc({
    required this.getFacturasUseCase,
    required this.getProvidersUseCase,
    required this.uploadFacturaUseCase,
    required this.confirmFacturaUseCase,
    required this.contabilizarFacturaUseCase,
  }) : super(const FacturasInitial()) {
    on<FacturasLoadRequested>(_onLoadRequested);
    on<FacturasPageChanged>(_onPageChanged);
    on<FacturasFilterChanged>(_onFilterChanged);
    on<FacturaUploadRequested>(_onUploadRequested);
    on<FacturaConfirmRequested>(_onConfirmRequested);
    on<FacturaContabilizarRequested>(_onContabilizarRequested);
  }

  Future<void> _onLoadRequested(
    FacturasLoadRequested event,
    Emitter<FacturasState> emit,
  ) async {
    emit(const FacturasLoading());
    try {
      final facturasResult = await getFacturasUseCase(
        GetFacturasParams(companyId: event.companyId),
      );
      final providersResult = await getProvidersUseCase(
        GetProvidersParams(companyId: event.companyId),
      );

      facturasResult.fold(
        (f) => emit(FacturasError(f.message)),
        (list) {
          final providers = providersResult.fold((_) => const <Provider>[], (p) => p);
          emit(FacturasLoaded(
            all: list,
            filtered: list,
            activeFilter: 'todos',
            currentPage: event.page,
            pageSize: event.pageSize,
            totalElements: list.length,
            providers: providers,
          ));
        },
      );
    } catch (e) {
      emit(FacturasError('Error al cargar facturas: ${e.runtimeType}'));
    }
  }

  void _onPageChanged(
    FacturasPageChanged event,
    Emitter<FacturasState> emit,
  ) {
    final current = state;
    if (current is! FacturasLoaded) return;

    emit(FacturasLoaded(
      all: current.all,
      filtered: current.filtered,
      activeFilter: current.activeFilter,
      currentPage: event.page,
      pageSize: current.pageSize,
      totalElements: current.totalElements,
      providers: current.providers,
    ));
  }

  void _onFilterChanged(
    FacturasFilterChanged event,
    Emitter<FacturasState> emit,
  ) {
    final current = state;
    if (current is! FacturasLoaded) return;
    final filtered = event.filter == 'todos'
        ? current.all
        : current.all
            .where((f) => f.type.toUpperCase() == event.filter.toUpperCase())
            .toList();
    emit(FacturasLoaded(
      all: current.all,
      filtered: filtered,
      activeFilter: event.filter,
      currentPage: 0, // Reset a primera página al filtrar
      pageSize: current.pageSize,
      totalElements: filtered.length,
      providers: current.providers,
    ));
  }

  Future<void> _onUploadRequested(
    FacturaUploadRequested event,
    Emitter<FacturasState> emit,
  ) async {
    emit(const FacturasLoading());
    try {
      final result = await uploadFacturaUseCase(
        UploadFacturaParams(
          companyId: event.companyId,
          type: event.type,
          bytes: event.bytes,
          filename: event.filename,
          providerId: event.providerId,
        ),
      );
      result.fold(
        (f) => emit(FacturasError(f.message)),
        (factura) => emit(FacturasUploadSuccess(factura)),
      );
    } catch (e) {
      emit(FacturasError('Error al subir factura: ${e.runtimeType}'));
    }
  }

  Future<void> _onConfirmRequested(
    FacturaConfirmRequested event,
    Emitter<FacturasState> emit,
  ) async {
    emit(const FacturasLoading());
    try {
      final result = await confirmFacturaUseCase(event.facturaId);
      result.fold(
        (f) => emit(FacturasError(f.message)),
        (factura) => emit(FacturasConfirmSuccess(factura)),
      );
    } catch (e) {
      emit(FacturasError('Error al confirmar: ${e.runtimeType}'));
    }
  }

  Future<void> _onContabilizarRequested(
    FacturaContabilizarRequested event,
    Emitter<FacturasState> emit,
  ) async {
    emit(const FacturasLoading());
    try {
      final result = await contabilizarFacturaUseCase(event.facturaId);
      result.fold(
        (f) => emit(FacturasError(f.message)),
        (factura) => emit(FacturasContabilizarSuccess(factura)),
      );
    } catch (e) {
      emit(FacturasError('Error al contabilizar: ${e.runtimeType}'));
    }
  }
}
