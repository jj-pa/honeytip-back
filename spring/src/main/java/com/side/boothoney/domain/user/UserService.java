package com.side.boothoney.domain.user;

public interface UserService {
    String registerUser(UserCommand.RegisterUser registerUser);
    void saveRole(UserCommand.SaveRole saveRole);
}
