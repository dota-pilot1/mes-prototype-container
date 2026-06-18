package com.cj.mesprototype.workorder.presentation.dto;

import com.cj.mesprototype.workorder.domain.WorkOrderStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateWorkOrderRequest(
        @Size(max = 100) String planCode,
        @Size(max = 100) String itemCode,
        @NotBlank @Size(max = 200) String itemName,
        @NotNull @Positive Integer quantity,
        @NotNull LocalDate startDate,
        @NotNull LocalDate dueDate,
        @Size(max = 200) String workstation,
        @Size(max = 100) String assignee,
        WorkOrderStatus status
) {
}
