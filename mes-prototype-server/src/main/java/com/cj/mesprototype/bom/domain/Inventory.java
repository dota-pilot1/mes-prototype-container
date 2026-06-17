package com.cj.mesprototype.bom.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "inventories", uniqueConstraints = @UniqueConstraint(columnNames = "item_id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false, unique = true)
    private Item item;

    @Column(name = "on_hand_qty", nullable = false, precision = 18, scale = 4)
    private BigDecimal onHandQty;

    @Column(name = "reserved_qty", nullable = false, precision = 18, scale = 4)
    private BigDecimal reservedQty;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Inventory create(Item item, BigDecimal onHandQty, BigDecimal reservedQty) {
        Inventory inventory = new Inventory();
        inventory.item = item;
        inventory.update(onHandQty, reservedQty);
        return inventory;
    }

    public void update(BigDecimal onHandQty, BigDecimal reservedQty) {
        this.onHandQty = onHandQty;
        this.reservedQty = reservedQty == null ? BigDecimal.ZERO : reservedQty;
    }

    public BigDecimal getAvailableQty() {
        return onHandQty.subtract(reservedQty);
    }
}
