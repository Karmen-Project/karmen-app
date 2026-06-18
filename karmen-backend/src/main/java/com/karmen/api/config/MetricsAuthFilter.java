package com.karmen.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Protege /actuator/prometheus con un Bearer token configurable.
 * Si METRICS_TOKEN está vacío (local dev), el endpoint queda abierto.
 * En producción (Render) debe configurarse un token aleatorio fuerte.
 */
@Component
@Order(1)
public class MetricsAuthFilter extends OncePerRequestFilter {

    @Value("${METRICS_TOKEN:}")
    private String metricsToken;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        if ("/actuator/prometheus".equals(request.getServletPath()) && !metricsToken.isBlank()) {
            String auth = request.getHeader("Authorization");
            if (!("Bearer " + metricsToken).equals(auth)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Unauthorized — metrics token required\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
