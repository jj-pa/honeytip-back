package com.side.boothoney.domain.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserStore userStore;

    @Override
    @Transactional
    public String registerUser(UserCommand.RegisterUser registerUser) {
        User user = userStore.store(registerUser.toEntity());
        return user.getUserToken();
    }

    @Override
    @Transactional
    public void saveRole(UserCommand.SaveRole saveRole) {
        Role role = userStore.store(saveRole.toEntity());
    }
}
