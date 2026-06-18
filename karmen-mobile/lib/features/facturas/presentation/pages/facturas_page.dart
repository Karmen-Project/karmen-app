import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/karmen_colors_extension.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../bloc/facturas_bloc.dart';
import '../bloc/facturas_event.dart';
import '../bloc/facturas_state.dart';
import '../widgets/factura_card.dart';

class FacturasPage extends StatelessWidget {
  const FacturasPage({super.key});

  @override
  Widget build(BuildContext context) {
    final authState = context.read<AuthBloc>().state;
    final companyId =
        authState is AuthAuthenticated ? authState.session.companyId : '';

    return BlocProvider(
      create: (_) => getIt<FacturasBloc>()
        ..add(FacturasLoadRequested(companyId: companyId)),
      child: const _FacturasView(),
    );
  }
}

class _FacturasView extends StatelessWidget {
  const _FacturasView();

  static const _filters = [
    ('todos', 'Todos'),
    ('INGRESO', 'Ingresos'),
    ('EGRESO', 'Egresos'),
  ];

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    final authState = context.read<AuthBloc>().state;
    final session =
        authState is AuthAuthenticated ? authState.session : null;

    return Scaffold(
      backgroundColor: c.bg,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Dashboard',
                style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: c.text)),
            if (session != null)
              Text(session.companyName,
                  style: GoogleFonts.inter(fontSize: 12, color: c.textSub)),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.add_circle_outline_rounded, color: c.accent),
            onPressed: () => context.go('/upload-factura'),
            tooltip: 'Cargar factura',
          ),
        ],
      ),
      body: BlocBuilder<FacturasBloc, FacturasState>(
        builder: (context, state) {
          final activeFilter =
              state is FacturasLoaded ? state.activeFilter : 'todos';

          return Column(
            children: [
              // Barra de filtros — filtrado local sin nueva llamada al API
              _FilterBar(
                filters: _filters,
                active: activeFilter,
                onSelect: (filter) => context
                    .read<FacturasBloc>()
                    .add(FacturasFilterChanged(filter)),
              ),
              Expanded(child: _buildBody(context, state, session, c)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildBody(BuildContext context, FacturasState state,
      dynamic session, dynamic c) {
    if (state is FacturasLoading) {
      return Center(child: CircularProgressIndicator(color: c.accent));
    }
    if (state is FacturasError) {
      return _ErrorView(
        message: state.message,
        onRetry: () => context.read<FacturasBloc>().add(
              FacturasLoadRequested(companyId: session?.companyId ?? ''),
            ),
      );
    }
    if (state is FacturasLoaded) {
      if (state.filtered.isEmpty) return const _EmptyView();
      final pageFacturas = state.currentPageFacturas;
      return Column(
        children: [
          Expanded(
            child: RefreshIndicator(
              color: c.accent,
              onRefresh: () async => context.read<FacturasBloc>().add(
                    FacturasLoadRequested(companyId: session?.companyId ?? ''),
                  ),
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: pageFacturas.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, i) => FacturaCard(
                  factura: pageFacturas[i],
                  onTap: () => context.go(
                    '/dashboard/factura/${pageFacturas[i].id}',
                    extra: pageFacturas[i],
                  ),
                ),
              ),
            ),
          ),
          // Controles de paginación
          _PaginationControls(
            currentPage: state.currentPage,
            totalPages: state.totalPages,
            totalElements: state.totalElements,
            pageSize: state.pageSize,
            hasPrevious: state.hasPreviousPage,
            hasNext: state.hasNextPage,
            onPrevious: state.hasPreviousPage
                ? () => context.read<FacturasBloc>().add(
                      FacturasPageChanged(state.currentPage - 1),
                    )
                : null,
            onNext: state.hasNextPage
                ? () => context.read<FacturasBloc>().add(
                      FacturasPageChanged(state.currentPage + 1),
                    )
                : null,
          ),
        ],
      );
    }
    return const SizedBox.shrink();
  }
}

class _FilterBar extends StatelessWidget {
  final List<(String, String)> filters;
  final String active;
  final void Function(String) onSelect;

  const _FilterBar(
      {required this.filters, required this.active, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return Container(
      color: c.surface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: filters.map((f) {
          final isActive = active == f.$1;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => onSelect(f.$1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: isActive ? c.accent : c.surfaceSecondary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  f.$2,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isActive ? Colors.white : c.textSub,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration:
                  BoxDecoration(color: c.redLight, shape: BoxShape.circle),
              child: Icon(Icons.error_outline_rounded, color: c.red, size: 28),
            ),
            const SizedBox(height: 16),
            Text(message,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 14, color: c.textSub)),
            const SizedBox(height: 20),
            OutlinedButton(
                onPressed: onRetry, child: const Text('Reintentar')),
          ],
        ),
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration:
                BoxDecoration(color: c.accentLight, shape: BoxShape.circle),
            child:
                Icon(Icons.receipt_long_outlined, size: 36, color: c.accent),
          ),
          const SizedBox(height: 16),
          Text('No hay facturas aún',
              style: GoogleFonts.inter(
                  fontSize: 16, fontWeight: FontWeight.w600, color: c.text)),
          const SizedBox(height: 6),
          Text('Carga tu primera factura con OCR',
              style: GoogleFonts.inter(fontSize: 14, color: c.textSub)),
        ],
      ),
    );
  }
}

class _PaginationControls extends StatelessWidget {
  final int currentPage;
  final int totalPages;
  final int totalElements;
  final int pageSize;
  final bool hasPrevious;
  final bool hasNext;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  const _PaginationControls({
    required this.currentPage,
    required this.totalPages,
    required this.totalElements,
    required this.pageSize,
    required this.hasPrevious,
    required this.hasNext,
    this.onPrevious,
    this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    final start = (currentPage * pageSize) + 1;
    final end = ((currentPage + 1) * pageSize).clamp(0, totalElements);

    return Container(
      width: double.infinity,
      color: c.surface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Información de paginación
          Text(
            'Mostrando $start-$end de $totalElements',
            style: GoogleFonts.inter(fontSize: 12, color: c.textSub),
          ),
          const SizedBox(height: 10),
          // Botones de navegación
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.max,
            children: [
              // Botón anterior
              Expanded(
                child: SizedBox(
                  height: 36,
                  child: ElevatedButton.icon(
                    onPressed: onPrevious,
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          hasPrevious ? c.accent : c.surfaceSecondary,
                      disabledBackgroundColor: c.surfaceSecondary,
                    ),
                    icon: Icon(Icons.chevron_left,
                        size: 16,
                        color: hasPrevious ? Colors.white : c.textMuted),
                    label: Text(
                      'Anterior',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: hasPrevious ? Colors.white : c.textMuted,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Indicador de página
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: c.surfaceSecondary,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${currentPage + 1}/$totalPages',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: c.text,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Botón siguiente
              Expanded(
                child: SizedBox(
                  height: 36,
                  child: ElevatedButton.icon(
                    onPressed: onNext,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: hasNext ? c.accent : c.surfaceSecondary,
                      disabledBackgroundColor: c.surfaceSecondary,
                    ),
                    icon: Icon(Icons.chevron_right,
                        size: 16,
                        color: hasNext ? Colors.white : c.textMuted),
                    label: Text(
                      'Siguiente',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: hasNext ? Colors.white : c.textMuted,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
