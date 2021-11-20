package com.side.boothoney.interfaces.user;

import com.side.boothoney.domain.user.UserCommand;
import org.mapstruct.InjectionStrategy;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = "spring",
        injectionStrategy = InjectionStrategy.CONSTRUCTOR,
        unmappedTargetPolicy = ReportingPolicy.ERROR
)
public interface UserDtoMapper {

    UserCommand.RegisterUser of(UserDto.RegisterUserRequest request);

    UserDto.RegisterResponse of(String userToken);
}
