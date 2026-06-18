package com.cj.mesprototype.workorder.infrastructure;

import com.cj.mesprototype.workorder.domain.WorkOrderProcess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkOrderProcessRepository extends JpaRepository<WorkOrderProcess, Long> {
    Optional<WorkOrderProcess> findByIdAndWorkOrderId(Long id, Long workOrderId);
}
