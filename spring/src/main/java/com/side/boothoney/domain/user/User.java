package com.side.boothoney.domain.user;

import com.side.boothoney.common.exception.InvalidParamException;
import com.side.boothoney.common.util.TokenGenerator;
import com.side.boothoney.domain.AbstractEntity;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.Collection;

@Slf4j
@Getter
@Entity
@NoArgsConstructor
@Table(name = "tb_user")
public class User extends AbstractEntity {

    private static final String USER_PREFIX = "user_";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String userToken;
    private String email;
    private String username;
    private String password;
    private String phoneNumber;

    private String currentHashedRefreshToken;

    private String kakaoId;

    @ManyToMany(fetch = FetchType.EAGER)
    private Collection<Role> roles = new ArrayList<>();

    @Builder
    public User(
            String username
    ) {
        if (username == null) throw new InvalidParamException("User.username");

        this.userToken = TokenGenerator.randomCharacterWithPrefix(USER_PREFIX);
        this.username = username;
    }
}
