package com.cj.mesprototype.config;

import com.cj.mesprototype.common.exception.BusinessException;
import com.cj.mesprototype.common.exception.ErrorCode;
import com.cj.mesprototype.role.domain.Role;
import com.cj.mesprototype.role.infrastructure.RoleRepository;
import com.cj.mesprototype.user.domain.User;
import com.cj.mesprototype.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Order(5)
@RequiredArgsConstructor
public class AdminUserSeeder implements ApplicationRunner {

    private static final String ADMIN_EMAIL = "terecal@daum.net";
    private static final String ADMIN_PASSWORD = "password123";
    private static final String ADMIN_USERNAME = "관리자";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            return;
        }

        Role adminRole = roleRepository.findByCode(RoleSeeder.ROLE_ADMIN)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));
        String passwordHash = passwordEncoder.encode(ADMIN_PASSWORD);

        userRepository.save(User.createNewUser(
                ADMIN_EMAIL,
                passwordHash,
                ADMIN_USERNAME,
                adminRole
        ));
        log.info("Seeded admin user: {}", ADMIN_EMAIL);
    }
}
