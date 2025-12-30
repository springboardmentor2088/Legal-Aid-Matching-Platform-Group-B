package com.jurify.jurify_backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendEmail(String to, String subject, String body) {
        // Fallback for plain text or legacy calls if any
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("jurify.springboard@gmail.com");
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    @Async
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("jurify.springboard@gmail.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String getEmailTemplate(String title, String message, String buttonText, String buttonUrl) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<style>" +
                "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }"
                +
                ".container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }"
                +
                ".header { background-color: #11676a; padding: 30px; text-align: center; }" +
                ".header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; }" +
                ".content { padding: 40px 30px; text-align: center; color: #333333; }" +
                ".content p { font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 30px; }" +
                ".button { display: inline-block; padding: 14px 28px; background-color: #11676a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: background-color 0.3s; }"
                +
                ".button:hover { background-color: #0e5658; }" +
                ".footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee; }"
                +
                ".logo-placeholder { font-size: 24px; font-weight: 800; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; }"
                +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<div class='logo-placeholder'>\u2696\uFE0F JURIFY</div>" +
                "</div>" +
                "<div class='content'>" +
                "<h2>" + title + "</h2>" +
                "<p>" + message + "</p>" +
                "<a href='" + buttonUrl + "' " +
                "style=\"display:inline-block;" +
                "padding:14px 28px;" +
                "background-color:#11676a;" +
                "color:#ffffff !important;" +
                "text-decoration:none;" +
                "border-radius:6px;" +
                "font-weight:bold;" +
                "font-size:16px;\">" +
                buttonText +
                "</a>"
                +
                "</div>" +
                "<div class='footer'>" +
                "<p>&copy; 2024 Jurify. All rights reserved.</p>" +
                "<p>This is an automated email, please do not reply.</p>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    @Async
    public void sendVerificationEmail(String to, String token) {
        String subject = "Verify your Jurify Account";
        String verificationUrl = "http://localhost:5173/verify-email?token=" + token;

        String htmlBody = getEmailTemplate(
                "Welcome to Jurify!",
                "Thank you for registering. To get started, please verify your email address by clicking the button below.",
                "VERIFY EMAIL",
                verificationUrl);

        sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Reset your Jurify Password";
        String resetUrl = "http://localhost:5173/reset-password?token=" + token;

        String htmlBody = getEmailTemplate(
                "Password Reset Request",
                "You recently requested to reset your password for your Jurify account. Click the button below to proceed.",
                "Reset Password",
                resetUrl);

        sendHtmlEmail(to, subject, htmlBody);
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
