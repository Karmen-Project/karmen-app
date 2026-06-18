import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/usecases/get_monthly_report_usecase.dart';
import 'reportes_event.dart';
import 'reportes_state.dart';

class ReportesBloc extends Bloc<ReportesEvent, ReportesState> {
  final GetMonthlyReportUseCase getMonthlyReportUseCase;

  ReportesBloc({required this.getMonthlyReportUseCase}) : super(const ReportesInitial()) {
    on<ReportesMonthlyRequested>(_onMonthlyRequested);
  }

  Future<void> _onMonthlyRequested(
    ReportesMonthlyRequested event,
    Emitter<ReportesState> emit,
  ) async {
    emit(const ReportesLoading());
    final result = await getMonthlyReportUseCase(
      GetMonthlyReportParams(
        companyId: event.companyId,
        year: event.year,
        month: event.month,
      ),
    );
    result.fold(
      (failure) => emit(ReportesError(failure.message)),
      (reporte) => emit(ReportesLoaded(reporte)),
    );
  }
}
