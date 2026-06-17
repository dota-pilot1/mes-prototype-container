package com.cj.mesprototype.site_settings.infrastructure;

import com.cj.mesprototype.site_settings.domain.SiteSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SiteSettingRepository extends JpaRepository<SiteSetting, Long> {
}
