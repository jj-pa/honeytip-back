package com.side.boothoney.domain.user;

public interface UserStore {
    User store(User user);
    Role store(Role role);
}
