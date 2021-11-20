package com.side.boothoney.config;

import org.springframework.beans.factory.annotation.Configurable;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@Configurable
public class JpaAuditingConfiguration {
}
