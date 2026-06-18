import 'package:equatable/equatable.dart';

import '../../domain/entities/factura.dart';
import '../../domain/entities/provider.dart';

abstract class FacturasState extends Equatable {
  const FacturasState();
  @override
  List<Object?> get props => [];
}

class FacturasInitial extends FacturasState {
  const FacturasInitial();
}

class FacturasLoading extends FacturasState {
  const FacturasLoading();
}

class FacturasLoaded extends FacturasState {
  final List<Factura> all;
  final List<Factura> filtered;
  final String activeFilter;
  final int currentPage;
  final int pageSize;
  final int totalElements;
  final List<Provider> providers;

  const FacturasLoaded({
    required this.all,
    required this.filtered,
    required this.activeFilter,
    required this.currentPage,
    this.pageSize = 10,
    required this.totalElements,
    this.providers = const [],
  });

  int get totalPages => (totalElements / pageSize).ceil();
  bool get hasNextPage => currentPage < totalPages - 1;
  bool get hasPreviousPage => currentPage > 0;

  List<Factura> get facturas => filtered;

  // Retorna la página actual de facturas filtradas
  List<Factura> get currentPageFacturas {
    final start = currentPage * pageSize;
    final end = (start + pageSize).clamp(0, filtered.length);
    return start < filtered.length ? filtered.sublist(start, end) : [];
  }

  @override
  List<Object> get props =>
      [all, filtered, activeFilter, currentPage, pageSize, totalElements, providers];
}

class FacturasUploadSuccess extends FacturasState {
  final Factura factura;
  const FacturasUploadSuccess(this.factura);

  @override
  List<Object> get props => [factura];
}

class FacturasConfirmSuccess extends FacturasState {
  final Factura factura;
  const FacturasConfirmSuccess(this.factura);

  @override
  List<Object> get props => [factura];
}

class FacturasContabilizarSuccess extends FacturasState {
  final Factura factura;
  const FacturasContabilizarSuccess(this.factura);

  @override
  List<Object> get props => [factura];
}

class FacturasError extends FacturasState {
  final String message;
  const FacturasError(this.message);

  @override
  List<Object> get props => [message];
}
