package com.cj.mesprototype.productionplan.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "production_plans", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String code;

    @Column(name = "item_id")
    private Long itemId;

    @Column(name = "item_code", length = 100)
    private String itemCode;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(name = "bom_code", length = 100)
    private String bomCode;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PlanStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static ProductionPlan create(
            String code,
            Long itemId,
            String itemCode,
            String itemName,
            String bomCode,
            Integer quantity,
            LocalDate startDate,
            LocalDate endDate,
            PlanStatus status
    ) {
        ProductionPlan plan = new ProductionPlan();
        plan.code = code;
        plan.itemId = itemId;
        plan.itemCode = itemCode;
        plan.itemName = itemName;
        plan.bomCode = bomCode;
        plan.quantity = quantity;
        plan.startDate = startDate;
        plan.endDate = endDate;
        plan.status = status == null ? PlanStatus.PLANNED : status;
        return plan;
    }

    public void update(
            Long itemId,
            String itemCode,
            String itemName,
            String bomCode,
            Integer quantity,
            LocalDate startDate,
            LocalDate endDate,
            PlanStatus status
    ) {
        this.itemId = itemId;
        this.itemCode = itemCode;
        this.itemName = itemName;
        this.bomCode = bomCode;
        this.quantity = quantity;
        this.startDate = startDate;
        this.endDate = endDate;
        if (status != null) {
            this.status = status;
        }
    }
}
