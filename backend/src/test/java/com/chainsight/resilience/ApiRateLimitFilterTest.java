package com.chainsight.resilience;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ApiRateLimitFilterTest {

    @Test
    void allowsUnprotectedPathsWithoutCallingRateLimiter() throws Exception {
        RedisTokenBucketRateLimiter rateLimiter = mock(RedisTokenBucketRateLimiter.class);
        ApiRateLimitFilter filter = new ApiRateLimitFilter(rateLimiter, 10, 1);
        FilterChain filterChain = mock(FilterChain.class);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/actuator/health");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(rateLimiter, never()).allowRequest(anyString());
        verify(rateLimiter, never()).allowRequest(anyString(), eq(10L), eq(1L));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void rejectsProtectedPathWhenBucketIsEmpty() throws Exception {
        RedisTokenBucketRateLimiter rateLimiter = mock(RedisTokenBucketRateLimiter.class);
        ApiRateLimitFilter filter = new ApiRateLimitFilter(rateLimiter, 10, 1);
        FilterChain filterChain = mock(FilterChain.class);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/analytics/network/daily");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(rateLimiter.allowRequest(anyString())).thenReturn(false);

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getContentAsString()).contains("RATE_LIMITED");
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void usesStricterPolicyForAuthEndpoints() throws Exception {
        RedisTokenBucketRateLimiter rateLimiter = mock(RedisTokenBucketRateLimiter.class);
        ApiRateLimitFilter filter = new ApiRateLimitFilter(rateLimiter, 10, 1);
        FilterChain filterChain = mock(FilterChain.class);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(rateLimiter.allowRequest(anyString(), eq(10L), eq(1L))).thenReturn(true);

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(200);
        verify(rateLimiter).allowRequest(anyString(), eq(10L), eq(1L));
        verify(rateLimiter, never()).allowRequest(anyString());
        verify(filterChain).doFilter(request, response);
    }
}
