package com.codegym.spring_boot.entity;

import com.codegym.spring_boot.entity.enums.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank(message = "Username không được để trống")
    @Size(min = 3, max = 50, message = "Username phải từ 3-50 ký tự")
    @Column(unique = true, nullable = false)
    private String username;

    @Column(name = "full_name")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank(message = "Password không được để trống")
    @Size(min = 6, message = "Password phải có ít nhất 6 ký tự")
    @Column(name = "password_hash", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.user;

    @Column(name = "global_rating")
    @Builder.Default
    private Integer globalRating = 0;

    @Column(name = "previous_global_rating")
    private Integer previousGlobalRating = 0;

    @Column(name = "practice_rating")
    @Builder.Default
    private Integer practiceRating = 0;

    @Column(name = "shop_balance")
    @Builder.Default
    private Integer shopBalance = 0;

    @Column(name = "is_contest_chat_locked")
    @Builder.Default
    private Boolean isContestChatLocked = false;

    @Column(name = "is_discussion_locked")
    @Builder.Default
    private Boolean isDiscussionLocked = false;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @PrimaryKeyJoinColumn
    private Profile profile;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserSubscription> userSubscriptions;

    /**
     * Helper method để lấy ra gói cước đang Active của User.
     * Nếu không có gói nào thì trả về null (sẽ rơi vào logic fallback lấy gói Free).
     */
    public UserSubscription getActiveSubscription() {
        if (userSubscriptions == null || userSubscriptions.isEmpty()) {
            return null;
        }
        LocalDateTime now = LocalDateTime.now();
        return userSubscriptions.stream()
                .filter(sub -> "ACTIVE".equals(sub.getStatus()) 
                        && sub.getStartDate().isBefore(now) 
                        && sub.getEndDate().isAfter(now))
                .findFirst()
                .orElse(null);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name().toUpperCase()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return !getIsDeleted();
    }

    @Override
    public boolean isAccountNonLocked() {
        return !getIsLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return !getIsDeleted();
    }
}
