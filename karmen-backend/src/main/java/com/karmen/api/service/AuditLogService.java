package com.karmen.api.service;

import com.karmen.api.domain.entity.AuditLog;
import com.karmen.api.domain.entity.User;
import com.karmen.api.domain.repository.AuditLogRepository;
import com.karmen.api.domain.repository.UserRepository;
import com.karmen.api.dto.invoice.AuditLogDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String entityType, Long entityId, String action, Long userId, Map<String, Object> details) {
        try {
            User userRef = userId != null ? userRepository.getReferenceById(userId) : null;
            var entry = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .user(userRef)
                .details(details)
                .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("No se pudo registrar evento de auditoría: {}", e.getMessage());
        }
    }

    public List<AuditLogDto> getInvoiceHistory(Long invoiceId) {
        return auditLogRepository
            .findByEntityTypeAndEntityIdOrderByCreatedAtDesc("INVOICE", invoiceId)
            .stream()
            .map(this::toDto)
            .toList();
    }

    private AuditLogDto toDto(AuditLog a) {
        String userName  = a.getUser() != null ? a.getUser().getFullName() : "Sistema";
        String userEmail = a.getUser() != null ? a.getUser().getEmail()    : "";
        return new AuditLogDto(a.getId(), a.getAction(), userName, userEmail, a.getCreatedAt(), a.getDetails());
    }
}
