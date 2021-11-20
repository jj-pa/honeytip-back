package com.side.boothoney.interfaces.user;

import com.side.boothoney.application.user.UserFacade;
import com.side.boothoney.common.response.CommonResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserApiController {
    private final UserFacade userFacade;
    private final UserDtoMapper userDtoMapper;

    @PostMapping
    public CommonResponse registerUser(@RequestBody @Valid UserDto.RegisterUserRequest request) {
        var userCommand = userDtoMapper.of(request);
        var userToken = userFacade.registerUser(userCommand);
        var response = userDtoMapper.of(userToken);
        return CommonResponse.success(response);
    }
}
