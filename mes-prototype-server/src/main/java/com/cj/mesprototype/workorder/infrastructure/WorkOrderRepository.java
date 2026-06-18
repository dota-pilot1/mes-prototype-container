package com.cj.mesprototype.workorder.infrastructure;

import com.cj.mesprototype.workorder.domain.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    boolean existsByCode(String code);

    Optional<WorkOrder> findByCode(String code);

    List<WorkOrder> findAllByOrderByCodeAsc();
}
