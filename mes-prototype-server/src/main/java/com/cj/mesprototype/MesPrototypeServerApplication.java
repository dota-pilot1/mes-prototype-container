package com.cj.mesprototype;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class MesPrototypeServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(MesPrototypeServerApplication.class, args);
	}

}
