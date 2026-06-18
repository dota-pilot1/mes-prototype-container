package com.cj.mesprototype.config;

import com.cj.mesprototype.menu.domain.Menu;
import com.cj.mesprototype.menu.infrastructure.MenuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Slf4j
@Component
@Order(4)
@RequiredArgsConstructor
public class MenuSeeder implements ApplicationRunner {

    private final MenuRepository menuRepository;

    private record MenuDef(
            String code, String parentCode, String label, String labelKey,
            String path, String icon, String requiredRole, int displayOrder
    ) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<MenuDef> defs = List.of(
                new MenuDef("DASHBOARD",             null,    "대시보드",      "nav.dashboard",        "/dashboard",        "LayoutDashboard", null,                    0),
                new MenuDef("BOM_MRP",               null,    "BOM/MRP",      "nav.bomMrp",           null,                "Package",         null,                    1),
                new MenuDef("BOM_MRP_ITEMS",         "BOM_MRP", "품목 관리",    "nav.itemManagement",   "/bom-mrp/items",    "Package",         null,                    0),
                new MenuDef("BOM_MRP_INVENTORIES",   "BOM_MRP", "재고 관리",    "nav.inventoryManagement", "/bom-mrp/inventories", "Settings",     null,                    1),
                new MenuDef("BOM_MRP_BOMS",          "BOM_MRP", "BOM 관리",    "nav.bomManagement",    "/bom-mrp/boms",     "Package",         null,                    2),
                new MenuDef("MRP_CALCULATE",         "BOM_MRP", "MRP 계산",    "nav.mrpCalculate",     "/bom-mrp/calculate","Calculator",      null,                    3),
                new MenuDef("BOM_MRP_ERD",           "BOM_MRP", "ERD",        "nav.erd",              "/bom-mrp/erd",      "Database",        null,                    4),
                new MenuDef("PRODUCTION_PLAN",       null,    "생산계획",      "nav.productionPlan",   null,                "CalendarClock",   null,                    2),
                new MenuDef("PRODUCTION_PLAN_BASIC", "PRODUCTION_PLAN", "생산계획 기본", "nav.productionPlanBasic", "/production-plans", "CalendarClock", null,             0),
                new MenuDef("PRODUCTION_PLAN_ERD",   "PRODUCTION_PLAN", "ERD", "nav.productionPlanErd", "/production-plans/erd", "Database", null,                         1),
                new MenuDef("PRODUCTION_PLAN_MANUAL","PRODUCTION_PLAN", "매뉴얼", "nav.productionPlanManual", "/production-plans/manual", "BookOpen", null,                 2),
                new MenuDef("WORK_ORDER",            null,    "작업지시",      "nav.workOrder",        null,                "ClipboardList",   null,                    3),
                new MenuDef("WORK_ORDER_PAGE",       "WORK_ORDER", "작업지시 관리", "nav.workOrderManagement", "/work-orders", "ClipboardList", null,                   0),
                new MenuDef("WORK_ORDER_WBS",        "WORK_ORDER", "작업지시 WBS", "nav.workOrderWbs", "/work-orders/wbs", "ChartGantt", null,                         1),
                new MenuDef("WORK_ORDER_REVIEW",     "WORK_ORDER", "코드 리뷰","nav.codeReview",       "/work-orders/review", "ShieldCheck",   null,                    2),
                new MenuDef("EQUIPMENT_RESERVATION", null,    "설비예약",      "nav.equipmentReservation", null,            "Settings",        null,                    4),
                new MenuDef("EQUIPMENT_RESERVATION_PAGE", "EQUIPMENT_RESERVATION", "페이지", "nav.page", "/equipment-reservations", "Settings", null,                    0),
                new MenuDef("EQUIPMENT_RESERVATION_REVIEW", "EQUIPMENT_RESERVATION", "코드 리뷰", "nav.codeReview", "/equipment-reservations/review", "ShieldCheck", null,                    1),
                new MenuDef("MONITORING",            null,    "모니터링",      "nav.monitoring",       null,                "BarChart3",       null,                    5),
                new MenuDef("MONITORING_PAGE",       "MONITORING", "페이지",   "nav.page",             "/monitoring",       "BarChart3",       null,                    0),
                new MenuDef("MONITORING_REVIEW",     "MONITORING", "코드 리뷰","nav.codeReview",       "/monitoring/review","ShieldCheck",     null,                    1),
                new MenuDef("ADMIN",                 null,    "관리",          "nav.admin",            null,                "Settings",        RoleSeeder.ROLE_ADMIN,   6),
                new MenuDef("ADMIN_USERS",           "ADMIN", "유저 관리",     "nav.users",            "/users",            "Users",           RoleSeeder.ROLE_ADMIN,   0),
                new MenuDef("ADMIN_ROLE_PERMISSIONS","ADMIN", "역할-권한 매핑","nav.rolePermissions",  "/role-permissions", "ShieldCheck",     RoleSeeder.ROLE_ADMIN,   1),
                new MenuDef("ADMIN_SITE_SETTINGS",   "ADMIN", "메인 관리",     "nav.siteSettings",     "/site-settings",   "LayoutDashboard", RoleSeeder.ROLE_ADMIN,   2),
                new MenuDef("ADMIN_MENU_MANAGEMENT", "ADMIN", "메뉴 관리",     "nav.menuManagement",   "/menu-management",  "Menu",            RoleSeeder.ROLE_ADMIN,   3)
        );
        Set<String> visibleCodes = defs.stream().map(MenuDef::code).collect(java.util.stream.Collectors.toSet());

        menuRepository.findAll().forEach(menu -> {
            if (!visibleCodes.contains(menu.getCode()) && menu.isVisible()) {
                menu.update(
                        menu.getParent(),
                        menu.getLabel(),
                        menu.getLabelKey(),
                        menu.getPath(),
                        menu.getIcon(),
                        menu.isExternal(),
                        menu.getRequiredRole(),
                        menu.getRequiredPermission(),
                        false,
                        menu.getDisplayOrder()
                );
            }
        });

        for (MenuDef def : defs) {
            Menu parent = def.parentCode() != null
                    ? menuRepository.findByCode(def.parentCode()).orElse(null)
                    : null;
            menuRepository.findByCode(def.code())
                    .ifPresentOrElse(
                            menu -> menu.update(
                                    parent,
                                    def.label(),
                                    def.labelKey(),
                                    def.path(),
                                    def.icon(),
                                    false,
                                    def.requiredRole(),
                                    null,
                                    true,
                                    def.displayOrder()
                            ),
                            () -> {
                                menuRepository.save(Menu.create(
                                        def.code(), parent, def.label(), def.labelKey(),
                                        def.path(), def.icon(), false,
                                        def.requiredRole(), null, true, def.displayOrder()
                                ));
                                log.info("Seeded menu: {}", def.code());
                            }
                    );
        }
    }
}
