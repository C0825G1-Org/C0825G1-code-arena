package com.codegym.spring_boot.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Async
    public void sendWelcomeEmail(String toEmail, String fullName) {
        try {
            Context context = new Context();
            context.setVariable("fullName", fullName != null && !fullName.isEmpty() ? fullName : "bạn");

            String process = templateEngine.process("welcome-email", context);
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setText(process, true);
            helper.setTo(toEmail);
            helper.setSubject("Chào mừng bạn gia nhập Code Arena!");
            helper.setFrom("Code Arena <triphung15@gmail.com>");

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    @Async
    public void sendOtpEmail(String toEmail, String fullName, String otp) {
        try {
            Context context = new Context();
            context.setVariable("fullName", fullName != null && !fullName.isEmpty() ? fullName : "bạn");
            context.setVariable("otp", otp);

            String process = templateEngine.process("otp-email", context);
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setText(process, true);
            helper.setTo(toEmail);
            helper.setSubject("Mã xác thực quên mật khẩu - Code Arena");
            helper.setFrom("Code Arena <triphung15@gmail.com>");

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
}
