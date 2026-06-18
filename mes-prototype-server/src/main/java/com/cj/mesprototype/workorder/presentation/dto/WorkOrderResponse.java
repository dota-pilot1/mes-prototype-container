package com.cj.mesprototype.workorder.presentation.dto;

import com.cj.mesprototype.workorder.domain.WorkOrder;
import com.cj.mesprototype.workorder.domain.WorkOrderStatus;

import java.time.LocalDate;
import java.util.List;

public record WorkOrderResponse(
        Long id,
        String code,
        String planCode,
        String itemCode,
        String itemName,
        Integer quantity,
        LocalDate startDate,
        LocalDate dueDate,
        String workstation,
        String assignee,
        WorkOrderStatus status,
        List<WorkOrderProcessResponse> processes
) {
    public static WorkOrderResponse from(WorkOrder order) {
        return new WorkOrderResponse(
                order.getId(),
                order.getCode(),
                order.getPlanCode(),
                order.getItemCode(),
                order.getItemName(),
                order.getQuantity(),
                order.getStartDate(),
                order.getDueDate(),
                order.getWorkstation(),
                order.getAssignee(),
                order.getStatus(),
                order.getProcesses().stream().map(WorkOrderProcessResponse::from).toList()
        );
    }
}
