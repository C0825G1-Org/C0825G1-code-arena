package com.codegym.spring_boot.entity;

import com.codegym.spring_boot.entity.enums.Difficulty;
import com.codegym.spring_boot.entity.enums.TestCaseStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "problems")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"createdBy", "tags", "ioTemplates"})
@EqualsAndHashCode(exclude = {"createdBy", "tags", "ioTemplates"})
public class Problem extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Column(nullable = false)
    private String title;

    @NotBlank(message = "Slug không được để trống")
    @Column(unique = true, nullable = false)
    private String slug;

    @NotBlank(message = "Mô tả không được để trống")
    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty = Difficulty.easy;

//    @Min(value = 100, message = "Thời gian giới hạn tối thiểu 100ms")
//    @Max(value = 5000, message = "Thời gian giới hạn tối đa 5s")
    @Column(name = "time_limit")
    private Integer timeLimit = 1000;

//    @Min(value = 16, message = "Bộ nhớ tối thiểu 16MB")
//    @Max(value = 1024, message = "Bộ nhớ tối đa 1024MB")
    @Column(name = "memory_limit")
    private Integer memoryLimit = 256;

    @Enumerated(EnumType.STRING)
    @Column(name = "testcase_status")
    private TestCaseStatus testcaseStatus = TestCaseStatus.not_uploaded;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "problem_tags",
        joinColumns = @JoinColumn(name = "problem_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ProblemIOTemplate> ioTemplates = new HashSet<>();
}
