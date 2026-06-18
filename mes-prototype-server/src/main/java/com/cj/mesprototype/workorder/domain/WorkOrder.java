package com.cj.mesprototype.workorder.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "work_orders", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String code;

    @Column(name = "plan_code", length = 100)
    private String planCode;

    @Column(name = "item_code", length = 100)
    private String itemCode;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(length = 200)
    private String workstation;

    @Column(length = 100)
    private String assignee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WorkOrderStatus status;

    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    private List<WorkOrderProcess> processes = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static WorkOrder create(
            String code,
            String planCode,
            String itemCode,
            String itemName,
            Integer quantity,
            LocalDate startDate,
            LocalDate dueDate,
            String workstation,
            String assignee,
            WorkOrderStatus status
    ) {
        WorkOrder order = new WorkOrder();
        order.code = code;
        order.planCode = planCode;
        order.itemCode = itemCode;
        order.itemName = itemName;
        order.quantity = quantity;
        order.startDate = startDate;
        order.dueDate = dueDate;
        order.workstation = workstation;
        order.assignee = assignee;
        order.status = status == null ? WorkOrderStatus.READY : status;
        return order;
    }

    public void update(
            String planCode,
            String itemCode,
            String itemName,
            Integer quantity,
            LocalDate startDate,
            LocalDate dueDate,
            String workstation,
            String assignee,
            WorkOrderStatus status
    ) {
        this.planCode = planCode;
        this.itemCode = itemCode;
        this.itemName = itemName;
        this.quantity = quantity;
        this.startDate = startDate;
        this.dueDate = dueDate;
        this.workstation = workstation;
        this.assignee = assignee;
        if (status != null) {
            this.status = status;
        }
    }

    public void addProcess(WorkOrderProcess process) {
        processes.add(process);
        process.assignWorkOrder(this);
    }

    public void removeProcess(WorkOrderProcess process) {
        processes.remove(process);
    }
}
