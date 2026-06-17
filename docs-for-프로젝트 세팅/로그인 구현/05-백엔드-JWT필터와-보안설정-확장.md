# 5. JwtAuthenticationFilter + SecurityConfig 확장

## 목표
모든 요청에서 Authorization 헤더 파싱 → SecurityContext 에 인증 주입. 회원가입 때 만든 `SecurityConfig` 에 필터/엔트리포인트 추가.

## 파일
```
com.cj.twilio.callcenter.auth
├─ security
│  ├─ JwtAuthenticationFilter.java   (신규)
│  └─ RestAuthenticationEntryPoint.java (신규)
└─ ...
com.cj.twilio.callcenter.config
└─ SecurityConfig.java               (수정)
```

### `auth/security/JwtAuthenticationFilter.java`
```java
package com.cj.twilio.callcenter.auth.security;

import com.cj.twilio.callcenter.auth.jwt.JwtTokenProvider;
import com.cj.twilio.callcenter.auth.jwt.TokenType;
import com.cj.twilio.callcenter.user.domain.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String token = resolveToken(request);
        if (token != null) {
            try {
                Claims claims = jwtTokenProvider.parse(token).getPayload();
                if (jwtTokenProvider.getType(claims) == TokenType.ACCESS) {
                    UserPrincipal principal = UserPrincipal.fromClaims(
                        jwtTokenProvider.getUserId(claims),
                        jwtTokenProvider.getEmail(claims),
                        UserRole.valueOf(jwtTokenProvider.getRole(claims))
                    );
                    UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (JwtException | IllegalArgumentException e) {
                // 토큰 무효 → 인증 세팅 안 함. 인증 필요한 엔드포인트면 EntryPoint 가 401.
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest req) {
        String h = req.getHeader(HEADER);
        if (StringUtils.hasText(h) && h.startsWith(PREFIX)) return h.substring(PREFIX.length());
        return null;
    }
}
```

### `auth/security/RestAuthenticationEntryPoint.java`
인증되지 않은 보호 엔드포인트 접근 시 JSON 으로 응답.
```java
package com.cj.twilio.callcenter.auth.security;

import com.cj.twilio.callcenter.common.exception.ErrorCode;
import com.cj.twilio.callcenter.common.response.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
            throws IOException {
        response.setStatus(ErrorCode.INVALID_CREDENTIALS.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), ErrorResponse.of(ErrorCode.INVALID_CREDENTIALS));
    }
}
```
> `INVALID_CREDENTIALS` 대신 `UNAUTHORIZED` 전용 코드 추가해도 좋음.

### 수정: `config/SecurityConfig.java`
회원가입 단계에서 만든 것에서 **변경**:
- `JwtAuthenticationFilter` 를 `UsernamePasswordAuthenticationFilter` 앞에 등록
- `exceptionHandling` 에 엔트리포인트 세팅
- `DaoAuthenticationProvider` 빈 등록 (로그인 API 에서 사용)
- permitAll 에 `/api/auth/login`, `/api/auth/refresh` 추가

```java
@Bean
public AuthenticationManager authenticationManager(
        CustomUserDetailsService uds,
        PasswordEncoder encoder) {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider(uds);
    provider.setPasswordEncoder(encoder);
    return new ProviderManager(provider);
}

@Bean
public SecurityFilterChain filterChain(
        HttpSecurity http,
        JwtAuthenticationFilter jwtFilter,
        RestAuthenticationEntryPoint entryPoint) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(eh -> eh.authenticationEntryPoint(entryPoint))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(
                "/api/auth/signup",
                "/api/auth/login",
                "/api/auth/refresh",
                "/api/auth/check-email"
            ).permitAll()
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .anyRequest().authenticated()
        )
        .httpBasic(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
}
```

> `AuthenticationManager` 는 로그인 서비스에서 `authenticate(UsernamePasswordAuthenticationToken)` 호출에 사용.

## 검증 (06 단계 컨트롤러와 함께)
- 유효 Access 토큰 → 보호 API 200
- 만료/위조 토큰 → 401 (엔트리포인트가 JSON 응답)
- 토큰 없음 + 보호 API → 401
- Refresh 토큰으로 일반 API 접근 → 401 (필터가 `ACCESS` 만 통과시킴)

## 주의
- 필터 등록 위치 `addFilterBefore(..., UsernamePasswordAuthenticationFilter.class)` 중요. 다른 위치 쓰면 SecurityContext 가 빈 상태로 컨트롤러까지 감.
- CORS preflight(`OPTIONS`) 는 반드시 permitAll. 안 하면 브라우저에서 로그인조차 안 됨.
- 필터에서 `SecurityContextHolder.clearContext()` 호출은 동일 스레드 재사용 대비 안전장치.
