package com.cj.mesprototype.workorder.application;

import com.cj.mesprototype.common.exception.BusinessException;
import com.cj.mesprototype.common.exception.ErrorCode;
import com.cj.mesprototype.workorder.domain.WorkOrder;
import com.cj.mesprototype.workorder.domain.WorkOrderProcess;
import com.cj.mesprototype.workorder.domain.WorkOrderStatus;
import com.cj.mesprototype.workorder.infrastructure.WorkOrderProcessRepository;
import com.cj.mesprototype.workorder.infrastructure.WorkOrderRepository;
import com.cj.mesprototype.workorder.presentation.dto.CreateWorkOrderRequest;
import com.cj.mesprototype.workorder.presentation.dto.UpdateWorkOrderRequest;
import com.cj.mesprototype.workorder.presentation.dto.WorkOrderProcessRequest;
import com.cj.mesprototype.workorder.presentation.dto.WorkOrderResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderProcessRepository workOrderProcessRepository;

    @Transactional(readOnly = true)
    public List<WorkOrderResponse> getWorkOrders() {
        return workOrderRepository.findAllByOrderByCodeAsc()
                .stream()
                .map(WorkOrderResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkOrderResponse getWorkOrder(Long id) {
        return WorkOrderResponse.from(getEntity(id));
    }

    @Transactional
    public WorkOrderResponse createWorkOrder(CreateWorkOrderRequest req) {
        if (workOrderRepository.existsByCode(req.code())) {
            throw new BusinessException(ErrorCode.WORK_ORDER_CODE_DUPLICATE);
        }

        WorkOrder order = WorkOrder.create(
                req.code(),
                req.planCode(),
                req.itemCode(),
                req.itemName(),
                req.quantity(),
                req.startDate(),
                req.dueDate(),
                req.workstation(),
                req.assignee(),
                req.status()
        );

        if (req.processes() != null && !req.processes().isEmpty()) {
            int sequence = 1;
            for (WorkOrderProcessRequest p : req.processes()) {
                order.addProcess(toProcess(p, p.sequence() == null ? sequence : p.sequence()));
                sequence++;
            }
        } else {
            addDefaultProcesses(order);
        }

        return WorkOrderResponse.from(workOrderRepository.save(order));
    }

    @Transactional
    public WorkOrderResponse updateWorkOrder(Long id, UpdateWorkOrderRequest req) {
        WorkOrder order = getEntity(id);
        order.update(
                req.planCode(),
                req.itemCode(),
                req.itemName(),
                req.quantity(),
                req.startDate(),
                req.dueDate(),
                req.workstation(),
                req.assignee(),
                req.status()
        );
        return WorkOrderResponse.from(order);
    }

    @Transactional
    public void deleteWorkOrder(Long id) {
        WorkOrder order = getEntity(id);
        workOrderRepository.delete(order);
    }

    @Transactional
    public WorkOrderResponse addProcess(Long orderId, WorkOrderProcessRequest req) {
        WorkOrder order = getEntity(orderId);
        int nextSequence = order.getProcesses().stream()
                .mapToInt(WorkOrderProcess::getSequence)
                .max()
                .orElse(0) + 1;
        order.addProcess(toProcess(req, req.sequence() == null ? nextSequence : req.sequence()));
        return WorkOrderResponse.from(order);
    }

    @Transactional
    public WorkOrderResponse updateProcess(Long orderId, Long processId, WorkOrderProcessRequest req) {
        getEntity(orderId);
        WorkOrderProcess process = workOrderProcessRepository
                .findByIdAndWorkOrderId(processId, orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WORK_ORDER_PROCESS_NOT_FOUND));
        process.update(
                req.sequence(),
                req.processCode(),
                req.processName(),
                req.workstation(),
                req.assignee(),
                req.startDate(),
                req.dueDate(),
                req.progress(),
                req.status()
        );
        return WorkOrderResponse.from(getEntity(orderId));
    }

    @Transactional
    public WorkOrderResponse deleteProcess(Long orderId, Long processId) {
        WorkOrder order = getEntity(orderId);
        WorkOrderProcess process = order.getProcesses().stream()
                .filter(p -> p.getId().equals(processId))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.WORK_ORDER_PROCESS_NOT_FOUND));
        order.removeProcess(process);
        return WorkOrderResponse.from(order);
    }

    private WorkOrder getEntity(Long id) {
        return workOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND));
    }

    private WorkOrderProcess toProcess(WorkOrderProcessRequest req, int sequence) {
        String processCode = req.processCode() != null && !req.processCode().isBlank()
                ? req.processCode()
                : String.format("PROC-%03d", sequence);
        return WorkOrderProcess.create(
                sequence,
                processCode,
                req.processName(),
                req.workstation(),
                req.assignee(),
                req.startDate(),
                req.dueDate(),
                req.progress(),
                req.status()
        );
    }

    // 작업지시만 등록하고 공정을 지정하지 않은 경우의 기본 공정(자재 출고 → 조립 → 검사/포장).
    private void addDefaultProcesses(WorkOrder order) {
        order.addProcess(WorkOrderProcess.create(
                1, "PROC-001", "자재 출고", "자재 창고", order.getAssignee(),
                order.getStartDate(), order.getStartDate(), 0, WorkOrderStatus.READY));
        order.addProcess(WorkOrderProcess.create(
                2, "PROC-002", "조립", order.getWorkstation(), order.getAssignee(),
                order.getStartDate(), order.getDueDate(), 0, WorkOrderStatus.READY));
        order.addProcess(WorkOrderProcess.create(
                3, "PROC-003", "검사/포장", "검사 포장실", order.getAssignee(),
                order.getDueDate(), order.getDueDate(), 0, WorkOrderStatus.READY));
    }
}
