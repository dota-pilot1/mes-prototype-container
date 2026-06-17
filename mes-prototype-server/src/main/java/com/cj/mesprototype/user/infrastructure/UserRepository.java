package com.cj.mesprototype.user.infrastructure;

import com.cj.mesprototype.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByRoleCode(String code);
    boolean existsByRoleId(Long roleId);
    Page<User> findAll(Pageable pageable);
}
