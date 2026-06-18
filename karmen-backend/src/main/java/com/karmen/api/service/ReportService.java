package com.karmen.api.service;

import com.karmen.api.domain.constant.InvoiceStatus;
import com.karmen.api.domain.constant.InvoiceType;
import com.karmen.api.domain.entity.Invoice;
import com.karmen.api.domain.repository.InvoiceRepository;
import com.karmen.api.security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final InvoiceRepository invoiceRepository;
    private final AuthorizationService authorizationService;

    public Map<String, Object> getMonthlyReport(Long companyId) {
        // Validar acceso a la empresa
        authorizationService.verifyCompanyAccess(companyId);
        
        var invoices = invoiceRepository.findByCompanyIdAndDeletedAtIsNull(companyId, PageRequest.of(0, 10000)).getContent();
        
        // Calcular totales del mes actual
        LocalDate now = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(now);
        
        var currentMonthInvoices = invoices.stream()
                .filter(i -> i.getInvoiceDate() != null && YearMonth.from(i.getInvoiceDate()).equals(currentMonth))
                .filter(i -> !InvoiceStatus.PENDIENTE.equals(i.getStatus()))
                .toList();
        
        BigDecimal totalIncome = currentMonthInvoices.stream()
                .filter(i -> InvoiceType.INGRESO.equals(i.getType()))
                .map(Invoice::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalExpense = currentMonthInvoices.stream()
                .filter(i -> InvoiceType.EGRESO.equals(i.getType()))
                .map(Invoice::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal netBalance = totalIncome.subtract(totalExpense);
        
        // Calcular IVA
        BigDecimal ivaCargo = currentMonthInvoices.stream()
                .filter(i -> InvoiceType.INGRESO.equals(i.getType()))
                .map(Invoice::getTaxAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal ivaFavor = currentMonthInvoices.stream()
                .filter(i -> InvoiceType.EGRESO.equals(i.getType()))
                .map(Invoice::getTaxAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Datos históricos de los últimos 13 meses
        List<Map<String, Object>> months = new ArrayList<>();
        for (int i = 12; i >= 0; i--) {
            YearMonth month = currentMonth.minusMonths(i);
            var monthInvoices = invoices.stream()
                    .filter(inv -> inv.getInvoiceDate() != null && YearMonth.from(inv.getInvoiceDate()).equals(month))
                    .filter(inv -> !InvoiceStatus.PENDIENTE.equals(inv.getStatus()))
                    .toList();
            
            BigDecimal monthIncome = monthInvoices.stream()
                    .filter(inv -> InvoiceType.INGRESO.equals(inv.getType()))
                    .map(Invoice::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal monthExpense = monthInvoices.stream()
                    .filter(inv -> InvoiceType.EGRESO.equals(inv.getType()))
                    .map(Invoice::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            months.add(Map.of(
                "mes", month.getMonth().getDisplayName(TextStyle.SHORT, Locale.forLanguageTag("es")),
                "ingresos", monthIncome,
                "egresos", monthExpense
            ));
        }
        
        return Map.of(
            "companyId", companyId,
            "month", currentMonth.toString(),
            "totalIncome", totalIncome,
            "totalExpense", totalExpense,
            "netBalance", netBalance,
            "invoiceCount", currentMonthInvoices.size(),
            "ivaCargo", ivaCargo,
            "ivaFavor", ivaFavor,
            "ivaPagar", ivaCargo.subtract(ivaFavor),
            "months", months
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRangeReport(Long companyId, LocalDate dateFrom, LocalDate dateTo) {
        authorizationService.verifyCompanyAccess(companyId);

        var all = invoiceRepository.findByCompanyId(companyId, PageRequest.of(0, 10000)).getContent();

        var rangeInvoices = all.stream()
                .filter(i -> i.getDeletedAt() == null)
                .filter(i -> i.getInvoiceDate() != null
                        && !i.getInvoiceDate().isBefore(dateFrom)
                        && !i.getInvoiceDate().isAfter(dateTo))
                .filter(i -> !InvoiceStatus.PENDIENTE.equals(i.getStatus()))
                .sorted(Comparator.comparing(Invoice::getInvoiceDate))
                .toList();

        BigDecimal totalIncome  = sumByType(rangeInvoices, InvoiceType.INGRESO, false);
        BigDecimal totalExpense = sumByType(rangeInvoices, InvoiceType.EGRESO,  false);
        BigDecimal ivaCargo     = sumByType(rangeInvoices, InvoiceType.INGRESO, true);
        BigDecimal ivaFavor     = sumByType(rangeInvoices, InvoiceType.EGRESO,  true);

        List<Map<String, Object>> movements = rangeInvoices.stream().map(i -> {
            String name = i.getNotes() != null && i.getNotes().startsWith("Comercio: ")
                    ? i.getNotes().split("\\|")[0].replace("Comercio: ", "").trim()
                    : null;
            Map<String, Object> m = new HashMap<>();
            m.put("date",        i.getInvoiceDate().toString());
            m.put("type",        i.getType());
            m.put("category",    InvoiceType.INGRESO.equals(i.getType()) ? "Ingreso" : "Gasto");
            m.put("amount",      i.getTotal());
            m.put("description", (name != null ? name + " — " : "") + i.getInvoiceNumber());
            m.put("status",      i.getStatus());
            return m;
        }).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("dateFrom",     dateFrom.toString());
        result.put("dateTo",       dateTo.toString());
        result.put("totalIncome",  totalIncome);
        result.put("totalExpense", totalExpense);
        result.put("netBalance",   totalIncome.subtract(totalExpense));
        result.put("invoiceCount", rangeInvoices.size());
        result.put("ivaCargo",     ivaCargo);
        result.put("ivaFavor",     ivaFavor);
        result.put("ivaPagar",     ivaCargo.subtract(ivaFavor));
        result.put("movements",    movements);
        return result;
    }

    private BigDecimal sumByType(List<Invoice> invoices, String type, boolean useTax) {
        return invoices.stream()
                .filter(i -> type.equals(i.getType()))
                .map(useTax ? Invoice::getTaxAmount : Invoice::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
