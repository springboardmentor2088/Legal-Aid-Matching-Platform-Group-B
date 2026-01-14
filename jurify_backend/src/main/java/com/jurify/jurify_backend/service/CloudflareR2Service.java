package com.jurify.jurify_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.S3Configuration;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.URI;
import java.util.UUID;

@Service
public class CloudflareR2Service {

    @Value("${cloudflare.r2.access-key}")
    private String accessKey;

    @Value("${cloudflare.r2.secret-key}")
    private String secretKey;

    @Value("${cloudflare.r2.endpoint}")
    private String endpoint;

    @Value("${cloudflare.r2.bucket}")
    private String bucket;

    private S3Client s3Client;
    private software.amazon.awssdk.services.s3.presigner.S3Presigner s3Presigner;

    @PostConstruct
    public void init() {
        s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.US_EAST_1)
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();

        s3Presigner = software.amazon.awssdk.services.s3.presigner.S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.US_EAST_1)
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }

    public String uploadFile(MultipartFile file, String directory) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String key = directory + "/" + UUID.randomUUID().toString() + extension;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        return key;
    }

    public String generatePresignedUrl(String key) {
        if (key == null || key.isEmpty())
            return null;

        try {
            software.amazon.awssdk.services.s3.model.GetObjectRequest getObjectRequest = software.amazon.awssdk.services.s3.model.GetObjectRequest
                    .builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest getObjectPresignRequest = software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest
                    .builder()
                    .signatureDuration(java.time.Duration.ofMinutes(60)) // URL valid for 60 minutes
                    .getObjectRequest(getObjectRequest)
                    .build();

            software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest presignedGetObjectRequest = s3Presigner
                    .presignGetObject(getObjectPresignRequest);
            return presignedGetObjectRequest.url().toString();
        } catch (Exception e) {
            System.err.println("Error generating presigned URL for key: " + key);
            e.printStackTrace();
            return null;
        }
    }

    public byte[] downloadFile(String key) {
        if (key == null || key.isEmpty())
            return null;
        try {
            software.amazon.awssdk.core.ResponseBytes<software.amazon.awssdk.services.s3.model.GetObjectResponse> objectBytes = s3Client
                    .getObjectAsBytes(software.amazon.awssdk.services.s3.model.GetObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .build());
            return objectBytes.asByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
