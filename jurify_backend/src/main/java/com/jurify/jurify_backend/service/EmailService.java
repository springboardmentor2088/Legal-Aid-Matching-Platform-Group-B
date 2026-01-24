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
        String buttonHtml = "";
        if (buttonText != null && buttonUrl != null && !buttonText.isEmpty()) {
            buttonHtml = "<a href='" + buttonUrl + "' class='button'>" + buttonText + "</a>";
        }

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<title>" + title + "</title>" +
                "<style>" +
                "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333333; }"
                +
                ".wrapper { width: 100%; table-layout: fixed; background-color: #f4f6f8; padding-bottom: 40px; }" +
                ".container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }"
                +
                ".header { background: linear-gradient(135deg, #11676a 0%, #0d5255 100%); padding: 35px 20px; text-align: center; }"
                +
                ".logo { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: 1px; text-transform: uppercase; display: inline-block; }"
                +
                ".logo span { color: #a5f3fc; }" + // Light accent for part of logo
                ".content { padding: 40px 30px; text-align: left; }" +
                ".content h2 { color: #11676a; margin-top: 0; font-size: 22px; font-weight: 700; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px; }"
                +
                ".content p { font-size: 16px; line-height: 1.7; color: #4b5563; margin-bottom: 25px; }" +
                ".button-container { text-align: center; margin-top: 35px; }" +
                ".button { display: inline-block; padding: 14px 32px; background-color: #11676a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(17, 103, 106, 0.2); }"
                +
                ".button:hover { background-color: #0e5658; transform: translateY(-1px); box-shadow: 0 6px 8px rgba(17, 103, 106, 0.3); }"
                +
                ".footer { background-color: #f9fafb; padding: 25px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; }"
                +
                ".footer p { margin: 5px 0; }" +
                ".social-links { margin-top: 10px; }" +
                ".social-links a { color: #11676a; text-decoration: none; margin: 0 8px; font-weight: 500; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='wrapper'>" +
                "<br>" + // Spacer
                "<div class='container'>" +
                "<div class='header'>" +
                "<div class='logo'>Jurify<span>.</span></div>" +
                "</div>" +
                "<div class='content'>" +
                "<h2>" + title + "</h2>" +
                "<p>" + message.replace("\n", "<br>") + "</p>" + // Support line breaks
                "<div class='button-container'>" + buttonHtml + "</div>" +
                "</div>" +
                "<div class='footer'>" +
                "<p>&copy; 2025 Jurify Legal Services. All rights reserved.</p>" +
                "<p>This email was sent automatically. Please do not reply directly to this address.</p>" +
                "<div class='social-links'>" +
                "<a href='#'>Privacy Policy</a> &bull; <a href='#'>Terms of Service</a>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    @org.springframework.beans.factory.annotation.Value("${jurify.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Async
    public void sendVerificationEmail(String to, String token) {
        String subject = "Verify your Jurify Account";
        String verificationUrl = frontendUrl + "/verify-email?token=" + token;

        String htmlBody = getEmailTemplate(
                "Welcome to Jurify!",
                "Thank you for joining Jurify. We are excited to have you on board.<br><br>" +
                        "To ensure the security of your account and access all features, please verify your email address by clicking the button below.",
                "Verify My Account",
                verificationUrl);

        sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Reset your Jurify Password";
        String resetUrl = frontendUrl + "/reset-password?token=" + token;

        String htmlBody = getEmailTemplate(
                "Password Reset Request",
                "We received a request to reset the password for your Jurify account.<br><br>" +
                        "If you did not make this request, you can safely ignore this email. Otherwise, click the button below to set a new password.",
                "Reset Password",
                resetUrl);

        sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    public void sendContactUsEmail(String fromEmail, String name, String subject, String messageContent) {
        // Send to ADMIN (internal notification)
        String adminSubject = "New Inquiry: " + subject;
        String adminBody = getEmailTemplate(
                "New Contact Us Inquiry",
                "<strong>From:</strong> " + name + " (" + fromEmail + ")<br><br>" +
                        "<strong>Subject:</strong> " + subject + "<br><br>" +
                        "<strong>Message:</strong><br>" + messageContent,
                "Reply to User",
                "mailto:" + fromEmail // Mailto link for easy reply
        );
        sendHtmlEmail("jurify.springboard@gmail.com", adminSubject, adminBody);

        // Send Acknowledgement to USER
        String userSubject = "We received your message - Jurify";
        String userBody = getEmailTemplate(
                "Thank you for contacting us",
                "Hi " + name + ",<br><br>" +
                        "We have received your message regarding '<strong>" + subject + "</strong>'.<br>" +
                        "Our team will review your inquiry and get back to you as soon as possible.",
                "Visit Homepage",
                frontendUrl);
        sendHtmlEmail(fromEmail, userSubject, userBody);
    }

    /**
     * Generic helper for sending branded HTML emails from other services
     */
    @Async
    public void sendGeneralEmail(String to, String subject, String title, String body, String buttonText,
            String buttonUrl) {
        String htmlBody = getEmailTemplate(title, body, buttonText, buttonUrl);
        sendHtmlEmail(to, subject, htmlBody);
    }
}
