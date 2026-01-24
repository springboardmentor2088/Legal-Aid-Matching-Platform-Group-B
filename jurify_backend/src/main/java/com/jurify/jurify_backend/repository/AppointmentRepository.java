package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.Appointment;
import com.jurify.jurify_backend.model.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
        List<Appointment> findByProviderId(Long providerId);

        List<Appointment> findByRequesterId(Long requesterId);

        List<Appointment> findByRequesterIdAndDate(Long requesterId, LocalDate date);

        List<Appointment> findByProviderIdAndDate(Long providerId, LocalDate date);

        List<Appointment> findByProviderIdAndStatus(Long providerId, AppointmentStatus status);

        List<Appointment> findByProviderIdAndStatusOrderByDateAscTimeAsc(Long providerId, AppointmentStatus status);

        List<Appointment> findByRequesterIdAndStatusOrderByDateAscTimeAsc(Long requesterId, AppointmentStatus status);

        List<Appointment> findByProviderIdAndStatusInOrderByDateAscTimeAsc(Long providerId,
                        List<AppointmentStatus> statuses);

        List<Appointment> findByRequesterIdAndStatusInOrderByDateAscTimeAsc(Long requesterId,
                        List<AppointmentStatus> statuses);

        List<Appointment> findByProviderIdAndRequesterId(Long providerId, Long requesterId);

        boolean existsByCaseIdAndProviderId(Long caseId, Long providerId);

        @Modifying
        @Transactional
        void deleteByCaseId(Long caseId);
}
