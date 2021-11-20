package com.side.boothoney.interfaces.user;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import javax.validation.constraints.NotNull;

public class UserDto {

    @Getter
    @Setter
    @ToString
    public static class RegisterUserRequest {

        @NotNull(message = "username은 필수 값입니다")
        private String username;
    }

    @Getter
    @Builder
    @ToString
    public static class RegisterResponse {
        private final String userToken;
    }
}
