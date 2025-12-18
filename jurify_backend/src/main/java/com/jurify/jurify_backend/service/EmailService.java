package com.jurify.jurify_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("jurify.springboard@gmail.com");
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    @Async
    public void sendVerificationEmail(String to, String token) {
        String subject = "Verify your Jurify Account";
        String verificationUrl = "http://localhost:5173/verify-email?token=" + token;
        String body = "Please click the link below to verify your email address:\n\n" + verificationUrl;
        sendEmail(to, subject, body);
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Reset your Jurify Password";
        String resetUrl = "http://localhost:5173/reset-password?token=" + token;
        String body = "You requested a password reset. Please click the link below to reset your password:\n\n"
                + resetUrl;
        sendEmail(to, subject, body);
    }

    @Async
    public void sendContactUsEmail(String fromEmail, String name, String subject, String messageContent) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("jurify.springboard@gmail.com"); // Sender must be the authenticated account
        message.setTo("jurify.springboard@gmail.com"); // Send to admin
        message.setSubject("Contact Us Inquiry: " + subject);
        message.setText("Name: " + name + "\nEmail: " + fromEmail + "\n\nMessage:\n" + messageContent);
        message.setReplyTo(fromEmail); // Allow admin to reply directly to user
        mailSender.send(message);
    }
}
