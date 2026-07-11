package com.chainsight.resilience;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private final RedisTokenBucketRateLimiter rateLimiter;
    private final long authCapacity;
    private final long authRefillTokensPerSecond;

    public ApiRateLimitFilter(
            RedisTokenBucketRateLimiter rateLimiter,
            @Value("${resilience.rate-limit.auth-capacity}") long authCapacity,
            @Value("${resilience.rate-limit.auth-refill-tokens-per-second}") long authRefillTokensPerSecond
    ) {
        this.rateLimiter = rateLimiter;
        this.authCapacity = authCapacity;
        this.authRefillTokensPerSecond = authRefillTokensPerSecond;
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

        String bucketId = clientId(request) + ":" + request.getMethod() + ":" + request.getRequestURI();
        boolean allowed = isAuthEndpoint(request)
                ? rateLimiter.allowRequest(Integer.toHexString(bucketId.hashCode()), authCapacity, authRefillTokensPerSecond)
                : rateLimiter.allowRequest(Integer.toHexString(bucketId.hashCode()));

        if (!allowed) {
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
        return path.startsWith("/api/v1/ingestion")
                || path.startsWith("/api/v1/analytics")
                || isAuthEndpoint(request);
    }

    private boolean isAuthEndpoint(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        return (method.equals("POST") && path.equals("/api/v1/auth/login"))
                || (method.equals("POST") && path.equals("/api/v1/auth/register"))
                || (method.equals("GET") && path.equals("/api/v1/auth/nonce"))
                || (method.equals("POST") && path.equals("/api/v1/auth/wallet-login"));
    }

    private String clientId(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
