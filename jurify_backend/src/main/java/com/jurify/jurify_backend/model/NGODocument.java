package com.jurify.jurify_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ngo_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NGODocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ngo_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private NGO ngo;

    @Column(name = "document_category")
    private String documentCategory; // REGISTRATION_CERT, DARPAN, PAN, ID_PROOF

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "s3_key")
    private String s3Key;

    @Column(name = "file_url")
    private String fileUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
