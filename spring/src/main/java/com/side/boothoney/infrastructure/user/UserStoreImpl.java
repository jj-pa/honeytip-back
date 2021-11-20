package com.side.boothoney.infrastructure.user;

import com.side.boothoney.domain.user.User;
import com.side.boothoney.domain.user.UserStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserStoreImpl implements UserStore {
    private final UserRepository userRepository;

    @Override
    public User store(User user) {
        return userRepository.save(user);
    }
}
