package com.cj.mesprototype.workorder.presentation.dto;

import com.cj.mesprototype.workorder.domain.WorkOrderStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record WorkOrderProcessRequest(
        Integer sequence,
        @Size(max = 100) String processCode,
        @NotBlank @Size(max = 200) String processName,
        @Size(max = 200) String workstation,
        @Size(max = 100) String assignee,
        @NotNull LocalDate startDate,
        @NotNull LocalDate dueDate,
        Integer progress,
        WorkOrderStatus status
) {
}
