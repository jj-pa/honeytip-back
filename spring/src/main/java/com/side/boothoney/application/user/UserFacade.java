package com.side.boothoney.application.user;

import com.side.boothoney.domain.user.UserCommand;
import com.side.boothoney.domain.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserFacade {
    private final UserService userService;

    public String registerUser(UserCommand.RegisterUser registerUser) {
        var userToken = userService.registerUser(registerUser);
        return userToken;
    }

    public void saveRole(UserCommand.SaveRole role) {
        userService.saveRole(role);
    }
}
