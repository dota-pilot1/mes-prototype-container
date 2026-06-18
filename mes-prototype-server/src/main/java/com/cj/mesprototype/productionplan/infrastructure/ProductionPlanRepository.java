package com.cj.mesprototype.productionplan.infrastructure;

import com.cj.mesprototype.productionplan.domain.ProductionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductionPlanRepository extends JpaRepository<ProductionPlan, Long> {
    boolean existsByCode(String code);

    List<ProductionPlan> findAllByOrderByCodeAsc();
}
