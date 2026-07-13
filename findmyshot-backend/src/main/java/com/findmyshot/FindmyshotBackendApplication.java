package com.findmyshot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FindmyshotBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(FindmyshotBackendApplication.class, args);
	}

}
