package com.cj.mesprototype.workorder.presentation.dto;

import com.cj.mesprototype.workorder.domain.WorkOrderProcess;
import com.cj.mesprototype.workorder.domain.WorkOrderStatus;

import java.time.LocalDate;

public record WorkOrderProcessResponse(
        Long id,
        Long orderId,
        Integer sequence,
        String processCode,
        String processName,
        String workstation,
        String assignee,
        LocalDate startDate,
        LocalDate dueDate,
        Integer progress,
        WorkOrderStatus status
) {
    public static WorkOrderProcessResponse from(WorkOrderProcess process) {
        return new WorkOrderProcessResponse(
                process.getId(),
                process.getWorkOrder().getId(),
                process.getSequence(),
                process.getProcessCode(),
                process.getProcessName(),
                process.getWorkstation(),
                process.getAssignee(),
                process.getStartDate(),
                process.getDueDate(),
                process.getProgress(),
                process.getStatus()
        );
    }
}
