package com.karmen.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final boolean enabled;

    @Value("${spring.mail.username:noreply@karmen.app}")
    private String fromAddress;

    public EmailService(
            @org.springframework.beans.factory.annotation.Autowired(required = false) JavaMailSender mailSender,
            @Value("${spring.mail.host:}") String mailHost) {
        this.mailSender = mailSender;
        this.enabled = mailSender != null && !mailHost.isBlank();
        if (!this.enabled) {
            log.info("Email service disabled — configure spring.mail.* to enable notifications");
        }
    }

    public void sendProfileUpdateNotification(String toEmail, String fullName) {
        send(toEmail, "Perfil actualizado — Karmen",
            "Hola " + fullName + ",\n\nTus datos de perfil han sido actualizados exitosamente.\n\nSi no realizaste este cambio, contacta al soporte.\n\nEquipo Karmen");
    }

    public void sendPasswordChangeNotification(String toEmail, String fullName) {
        send(toEmail, "Contraseña cambiada — Karmen",
            "Hola " + fullName + ",\n\nTu contraseña ha sido cambiada exitosamente.\n\nSi no realizaste este cambio, contacta al soporte de inmediato.\n\nEquipo Karmen");
    }

    public void sendCompanyUpdateNotification(String toEmail, String companyName) {
        send(toEmail, "Datos de empresa actualizados — Karmen",
            "Hola,\n\nLos datos de la empresa \"" + companyName + "\" han sido actualizados exitosamente.\n\nEquipo Karmen");
    }

    private void send(String to, String subject, String body) {
        if (!enabled) {
            log.info("Email (disabled) to={} subject={}", to, subject);
            return;
        }
        try {
            var msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("Email sent to={} subject={}", to, subject);
        } catch (Exception e) {
            log.warn("Failed to send email to={}: {}", to, e.getMessage());
        }
    }
}
