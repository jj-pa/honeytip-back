package com.side.boothoney.domain.user;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

public class UserCommand {

    @Getter
    @Builder
    @ToString
    public static class RegisterUser {
        private final String username;

        public User toEntity() {
            return User.builder()
                    .username(username)
                    .build();
        }
    }

    @Getter
    @Builder
    @ToString
    public static class SaveRole {
        private final String name;

        public Role toEntity() {
            return Role.builder()
                    .name(name)
                    .build();
        }
    }
}
