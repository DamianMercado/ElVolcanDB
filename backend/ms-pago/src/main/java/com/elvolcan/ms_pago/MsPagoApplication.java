package com.elvolcan.ms_pago;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class MsPagoApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsPagoApplication.class, args);
    }
}
