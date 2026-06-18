package com.cj.mesprototype.workorder.presentation;

import com.cj.mesprototype.workorder.application.WorkOrderService;
import com.cj.mesprototype.workorder.presentation.dto.CreateWorkOrderRequest;
import com.cj.mesprototype.workorder.presentation.dto.UpdateWorkOrderRequest;
import com.cj.mesprototype.workorder.presentation.dto.WorkOrderProcessRequest;
import com.cj.mesprototype.workorder.presentation.dto.WorkOrderResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "WorkOrder", description = "작업지시 관리")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    @GetMapping("/work-orders")
    @Operation(summary = "작업지시 목록 조회 (공정 포함)")
    public List<WorkOrderResponse> getWorkOrders() {
        return workOrderService.getWorkOrders();
    }

    @GetMapping("/work-orders/{id}")
    @Operation(summary = "작업지시 상세 조회")
    public WorkOrderResponse getWorkOrder(@PathVariable Long id) {
        return workOrderService.getWorkOrder(id);
    }

    @PostMapping("/work-orders")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "작업지시 등록 (ROLE_ADMIN)")
    public ResponseEntity<WorkOrderResponse> createWorkOrder(@Valid @RequestBody CreateWorkOrderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workOrderService.createWorkOrder(req));
    }

    @PutMapping("/work-orders/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "작업지시 수정 (ROLE_ADMIN)")
    public WorkOrderResponse updateWorkOrder(
            @PathVariable Long id,
            @Valid @RequestBody UpdateWorkOrderRequest req) {
        return workOrderService.updateWorkOrder(id, req);
    }

    @DeleteMapping("/work-orders/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "작업지시 삭제 (ROLE_ADMIN)")
    public ResponseEntity<Void> deleteWorkOrder(@PathVariable Long id) {
        workOrderService.deleteWorkOrder(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/work-orders/{id}/processes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "작업지시 공정 추가 (ROLE_ADMIN)")
    public ResponseEntity<WorkOrderResponse> addProcess(
            @PathVariable Long id,
            @Valid @RequestBody WorkOrderProcessRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workOrderService.addProcess(id, req));
    }

    @PutMapping("/work-orders/{id}/processes/{processId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "작업지시 공정 수정 (ROLE_ADMIN)")
    public WorkOrderResponse updateProcess(
            @PathVariable Long id,
            @PathVariable Long processId,
            @Valid @RequestBody WorkOrderProcessRequest req) {
        return workOrderService.updateProcess(id, processId, req);
    }

    @DeleteMapping("/work-orders/{id}/processes/{processId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "작업지시 공정 삭제 (ROLE_ADMIN)")
    public WorkOrderResponse deleteProcess(
            @PathVariable Long id,
            @PathVariable Long processId) {
        return workOrderService.deleteProcess(id, processId);
    }
}
