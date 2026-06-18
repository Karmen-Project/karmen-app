import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_format.dart';
import '../../../../core/theme/karmen_colors_extension.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../bloc/reportes_bloc.dart';
import '../bloc/reportes_event.dart';
import '../bloc/reportes_state.dart';

class ReportesPage extends StatelessWidget {
  const ReportesPage({super.key});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    return BlocProvider(
      create: (_) {
        final authState = context.read<AuthBloc>().state;
        final companyId =
            authState is AuthAuthenticated ? authState.session.companyId : '';
        return getIt<ReportesBloc>()
          ..add(ReportesMonthlyRequested(
              companyId: companyId, year: now.year, month: now.month));
      },
      child: const _ReportesView(),
    );
  }
}

class _ReportesView extends StatelessWidget {
  const _ReportesView();

  void _refreshReport(BuildContext context) {
    final now = DateTime.now();
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthAuthenticated) {
      context.read<ReportesBloc>().add(ReportesMonthlyRequested(
            companyId: authState.session.companyId,
            year: now.year,
            month: now.month,
          ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.kc;

    return Scaffold(
      backgroundColor: c.bg,
      appBar: AppBar(
        title: Text('Reportes',
            style: GoogleFonts.inter(
                fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: BlocBuilder<ReportesBloc, ReportesState>(
        builder: (context, state) {
          if (state is ReportesLoading) {
            return Center(child: CircularProgressIndicator(color: c.accent));
          }
          if (state is ReportesError) {
            return Center(
                child: Text(state.message,
                    style: GoogleFonts.inter(color: c.red)));
          }
          if (state is ReportesLoaded) {
            final r = state.reporte;

            return RefreshIndicator(
              color: c.accent,
              onRefresh: () async => _refreshReport(context),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _KpiTile(
                            label: 'Ingresos',
                            value: formatCOP(r.totalIncome),
                            icon: Icons.arrow_downward_rounded,
                            iconColor: c.green,
                            iconBg: c.greenLight,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _KpiTile(
                            label: 'Egresos',
                            value: formatCOP(r.totalExpense),
                            icon: Icons.arrow_upward_rounded,
                            iconColor: c.red,
                            iconBg: c.redLight,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _KpiTile(
                      label: 'Balance neto',
                      value: formatCOP(r.netBalance),
                      icon: Icons.account_balance_outlined,
                      iconColor: r.netBalance >= 0 ? c.green : c.red,
                      iconBg: r.netBalance >= 0 ? c.greenLight : c.redLight,
                      valueColor: r.netBalance >= 0 ? c.green : c.red,
                    ),
                    const SizedBox(height: 24),
                    Text('Ingresos vs Egresos',
                        style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: c.text)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: AppTheme.cardDecoration(c),
                      child: Column(
                        children: [
                          SizedBox(
                            height: 200,
                            child: r.months.isEmpty
                                ? Center(
                                    child: Text('Sin datos disponibles',
                                        style: GoogleFonts.inter(
                                            color: c.textMuted)))
                                : BarChart(BarChartData(
                                    alignment: BarChartAlignment.spaceAround,
                                    barGroups: r.months
                                        .asMap()
                                        .entries
                                        .map((e) => BarChartGroupData(
                                              x: e.key,
                                              barRods: [
                                                BarChartRodData(
                                                    toY: e.value.ingresos,
                                                    color: c.green,
                                                    width: 10,
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            4)),
                                                BarChartRodData(
                                                    toY: e.value.egresos,
                                                    color: c.red,
                                                    width: 10,
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            4)),
                                              ],
                                            ))
                                        .toList(),
                                    titlesData: FlTitlesData(
                                      bottomTitles: AxisTitles(
                                        sideTitles: SideTitles(
                                          showTitles: true,
                                          getTitlesWidget: (v, _) {
                                            final idx = v.toInt();
                                            if (idx >= 0 &&
                                                idx < r.months.length) {
                                              return Padding(
                                                padding: const EdgeInsets.only(
                                                    top: 4),
                                                child: Text(
                                                  r.months[idx].month
                                                      .substring(0, 3),
                                                  style: GoogleFonts.inter(
                                                      fontSize: 10,
                                                      color: c.textSub),
                                                ),
                                              );
                                            }
                                            return const SizedBox.shrink();
                                          },
                                        ),
                                      ),
                                      leftTitles: const AxisTitles(
                                          sideTitles:
                                              SideTitles(showTitles: false)),
                                      topTitles: const AxisTitles(
                                          sideTitles:
                                              SideTitles(showTitles: false)),
                                      rightTitles: const AxisTitles(
                                          sideTitles:
                                              SideTitles(showTitles: false)),
                                    ),
                                    gridData: const FlGridData(show: false),
                                    borderData: FlBorderData(show: false),
                                  )),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _Dot(color: c.green, label: 'Ingresos'),
                              const SizedBox(width: 20),
                              _Dot(color: c.red, label: 'Egresos'),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }
}

class _KpiTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final Color? valueColor;

  const _KpiTile({
    required this.label,
    required this.value,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.cardDecoration(c),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
                color: iconBg, borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: c.textSub)),
                const SizedBox(height: 2),
                Text(value,
                    style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: valueColor ?? c.text)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  final Color color;
  final String label;
  const _Dot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Container(
              width: 10,
              height: 10,
              decoration:
                  BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 12, color: context.kc.textSub)),
        ],
      );
}
