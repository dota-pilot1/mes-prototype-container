package com.cj.mesprototype.bom.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "boms", uniqueConstraints = @UniqueConstraint(columnNames = "bom_code"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Bom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bom_code", nullable = false, length = 100, unique = true)
    private String bomCode;

    @Column(name = "bom_name", nullable = false, length = 100)
    private String bomName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_item_id", nullable = false)
    private Item productItem;

    @Column(nullable = false, length = 50)
    private String version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BomStatus status;

    @Column(length = 500)
    private String description;

    @OneToMany(mappedBy = "bom", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<BomLine> lines = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static Bom create(
            String bomCode,
            String bomName,
            Item productItem,
            String version,
            BomStatus status,
            String description
    ) {
        Bom bom = new Bom();
        bom.bomCode = bomCode;
        bom.bomName = bomName;
        bom.productItem = productItem;
        bom.version = version;
        bom.status = status == null ? BomStatus.DRAFT : status;
        bom.description = description;
        return bom;
    }

    public void addLine(BomLine line) {
        lines.add(line);
        line.assignBom(this);
    }
}
