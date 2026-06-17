package com.cj.mesprototype.bom.infrastructure;

import com.cj.mesprototype.bom.domain.Bom;
import com.cj.mesprototype.bom.domain.BomStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BomRepository extends JpaRepository<Bom, Long> {
    boolean existsByBomCode(String bomCode);

    Optional<Bom> findByBomCode(String bomCode);

    boolean existsByProductItemIdAndStatus(Long productItemId, BomStatus status);

    Optional<Bom> findByProductItemIdAndStatus(Long productItemId, BomStatus status);

    List<Bom> findAllByOrderByIdDesc();
}
