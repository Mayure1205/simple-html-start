package com.chainsight.resilience;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private final RedisTokenBucketRateLimiter rateLimiter;

    public ApiRateLimitFilter(RedisTokenBucketRateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!isProtectedApi(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String bucketId = clientId(request) + ":" + request.getRequestURI();
        if (!rateLimiter.allowRequest(Integer.toHexString(bucketId.hashCode()))) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("""
                    {"errorCode":"RATE_LIMITED","message":"Too many requests"}
                    """);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isProtectedApi(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/v1/ingestion") || path.startsWith("/api/v1/analytics");
    }

    private String clientId(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
