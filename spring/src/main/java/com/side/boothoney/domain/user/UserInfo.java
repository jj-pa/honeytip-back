package com.side.boothoney.domain.user;

import lombok.Getter;

@Getter
public class UserInfo {

    private final Long id;
    private final String email;
    private final String username;

    public UserInfo(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.username = user.getUsername();
    }
}
