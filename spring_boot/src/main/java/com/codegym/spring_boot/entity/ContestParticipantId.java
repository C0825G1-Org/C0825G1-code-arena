package com.codegym.spring_boot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ContestParticipantId implements Serializable {
    @Column(name = "contest_id")
    private Integer contestId;

    @Column(name = "user_id")
    private Integer userId;
}
