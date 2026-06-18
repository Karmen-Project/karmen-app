import 'dart:typed_data';

import 'package:equatable/equatable.dart';

abstract class FacturasEvent extends Equatable {
  const FacturasEvent();
  @override
  List<Object?> get props => [];
}

class FacturasLoadRequested extends FacturasEvent {
  final String companyId;
  final int page;
  final int pageSize;

  const FacturasLoadRequested({
    required this.companyId,
    this.page = 0,
    this.pageSize = 10,
  });

  @override
  List<Object> get props => [companyId, page, pageSize];
}

class FacturasPageChanged extends FacturasEvent {
  final int page;

  const FacturasPageChanged(this.page);

  @override
  List<Object> get props => [page];
}

class FacturasFilterChanged extends FacturasEvent {
  final String filter;
  const FacturasFilterChanged(this.filter);

  @override
  List<Object> get props => [filter];
}

class FacturaUploadRequested extends FacturasEvent {
  final String companyId;
  final String type;
  final Uint8List bytes;
  final String filename;
  final String? providerId;

  const FacturaUploadRequested({
    required this.companyId,
    required this.type,
    required this.bytes,
    required this.filename,
    this.providerId,
  });

  @override
  List<Object?> get props => [companyId, type, filename, providerId];
}

class FacturaConfirmRequested extends FacturasEvent {
  final String facturaId;
  const FacturaConfirmRequested(this.facturaId);

  @override
  List<Object> get props => [facturaId];
}

class FacturaContabilizarRequested extends FacturasEvent {
  final String facturaId;
  const FacturaContabilizarRequested(this.facturaId);

  @override
  List<Object> get props => [facturaId];
}
