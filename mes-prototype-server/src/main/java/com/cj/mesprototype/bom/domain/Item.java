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
@Table(name = "items", uniqueConstraints = @UniqueConstraint(columnNames = "item_code"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_code", nullable = false, length = 100, unique = true)
    private String itemCode;

    @Column(name = "item_name", nullable = false, length = 100)
    private String itemName;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 30)
    private ItemType itemType;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "safety_stock", nullable = false, precision = 18, scale = 4)
    private BigDecimal safetyStock;

    @Column(length = 500)
    private String description;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static Item create(
            String itemCode,
            String itemName,
            ItemType itemType,
            String unit,
            BigDecimal safetyStock,
            String description
    ) {
        Item item = new Item();
        item.itemCode = itemCode;
        item.itemName = itemName;
        item.itemType = itemType;
        item.unit = unit;
        item.safetyStock = safetyStock == null ? BigDecimal.ZERO : safetyStock;
        item.description = description;
        return item;
    }
}
