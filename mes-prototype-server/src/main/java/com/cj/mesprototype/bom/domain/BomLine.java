package com.cj.mesprototype.bom.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "bom_lines")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BomLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bom_id", nullable = false)
    private Bom bom;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "material_item_id", nullable = false)
    private Item materialItem;

    @Column(name = "required_qty", nullable = false, precision = 18, scale = 4)
    private BigDecimal requiredQty;

    @Column(name = "loss_rate", nullable = false, precision = 10, scale = 4)
    private BigDecimal lossRate;

    @Column(length = 500)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static BomLine create(Item materialItem, BigDecimal requiredQty, BigDecimal lossRate, String description) {
        BomLine line = new BomLine();
        line.materialItem = materialItem;
        line.requiredQty = requiredQty;
        line.lossRate = lossRate == null ? BigDecimal.ZERO : lossRate;
        line.description = description;
        return line;
    }

    void assignBom(Bom bom) {
        this.bom = bom;
    }
}
