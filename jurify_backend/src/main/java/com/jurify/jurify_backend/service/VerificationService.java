package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.VerificationRequestDTO;
import com.jurify.jurify_backend.model.*;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.model.enums.VerificationStatus;
import com.jurify.jurify_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private final VerificationRequestRepository verificationRequestRepository;
    private final UserRepository userRepository;
    private final LawyerRepository lawyerRepository;
    private final NGORepository ngoRepository;

    @Transactional
    public VerificationRequest submitVerificationRequest(Long userId, VerificationRequestDTO requestDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != UserRole.LAWYER && user.getRole() != UserRole.NGO) {
            throw new RuntimeException("Only Lawyers and NGOs can submit verification requests");
        }

        // Check if there is already a pending request
        if (verificationRequestRepository.findByUserIdAndStatus(userId, VerificationStatus.PENDING).isPresent()) {
            throw new RuntimeException("A pending verification request already exists");
        }

        // Also check if already verified
        boolean isVerified = false;
        if (user.getRole() == UserRole.LAWYER && user.getLawyer() != null && user.getLawyer().getIsVerified()) {
            isVerified = true;
        } else if (user.getRole() == UserRole.NGO && user.getNgo() != null && user.getNgo().getIsVerified()) {
            isVerified = true;
        }

        if (isVerified) {
            throw new RuntimeException("User is already verified");
        }

        VerificationRequest request = VerificationRequest.builder()
                .user(user)
                .documentUrl(requestDTO.getDocumentUrl())
                .documentType(requestDTO.getDocumentType())
                .status(VerificationStatus.PENDING)
                .build();

        return verificationRequestRepository.save(request);
    }

    public List<VerificationRequest> getPendingRequests() {
        return verificationRequestRepository.findByStatus(VerificationStatus.PENDING);
    }

    @Transactional
    public VerificationRequest approveRequest(Long requestId, Long adminId) {
        VerificationRequest request = verificationRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != VerificationStatus.PENDING) {
            throw new RuntimeException("Request is not pending");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        request.setStatus(VerificationStatus.VERIFIED);
        request.setReviewedBy(admin);
        request.setReviewedAt(LocalDateTime.now());

        User user = request.getUser();
        if (user.getRole() == UserRole.LAWYER) {
            Lawyer lawyer = user.getLawyer();
            if (lawyer != null) {
                lawyer.setIsVerified(true);
                lawyer.setVerificationStatus(VerificationStatus.VERIFIED);
                lawyer.setVerificationDate(LocalDateTime.now());
                lawyerRepository.save(lawyer);
            }
        } else if (user.getRole() == UserRole.NGO) {
            NGO ngo = user.getNgo();
            if (ngo != null) {
                ngo.setIsVerified(true);
                ngo.setVerificationStatus(VerificationStatus.VERIFIED);
                ngo.setVerificationDate(LocalDateTime.now());
                ngoRepository.save(ngo);
            }
        }

        return verificationRequestRepository.save(request);
    }

    @Transactional
    public VerificationRequest rejectRequest(Long requestId, Long adminId, String reason) {
        VerificationRequest request = verificationRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != VerificationStatus.PENDING) {
            throw new RuntimeException("Request is not pending");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        request.setStatus(VerificationStatus.REJECTED);
        request.setRejectionReason(reason);
        request.setReviewedBy(admin);
        request.setReviewedAt(LocalDateTime.now());

        User user = request.getUser();
        if (user.getRole() == UserRole.LAWYER) {
            Lawyer lawyer = user.getLawyer();
            if (lawyer != null) {
                lawyer.setVerificationStatus(VerificationStatus.REJECTED);
                lawyerRepository.save(lawyer);
            }
        } else if (user.getRole() == UserRole.NGO) {
            NGO ngo = user.getNgo();
            if (ngo != null) {
                ngo.setVerificationStatus(VerificationStatus.REJECTED);
                ngoRepository.save(ngo);
            }
        }

        return verificationRequestRepository.save(request);
    }
}
