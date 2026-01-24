package com.jurify.jurify_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class JurifyBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(JurifyBackendApplication.class, args);
	}

	@org.springframework.context.annotation.Bean
	public com.fasterxml.jackson.databind.ObjectMapper objectMapper() {
		return new com.fasterxml.jackson.databind.ObjectMapper();
	}

}
