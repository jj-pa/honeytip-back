package com.side.boothoney.interfaces.user;

import com.side.boothoney.domain.user.UserCommand.RegisterUser;
import com.side.boothoney.domain.user.UserCommand.RegisterUser.RegisterUserBuilder;
import com.side.boothoney.interfaces.user.UserDto.RegisterResponse;
import com.side.boothoney.interfaces.user.UserDto.RegisterResponse.RegisterResponseBuilder;
import com.side.boothoney.interfaces.user.UserDto.RegisterUserRequest;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2021-11-20T16:42:41+0900",
    comments = "version: 1.4.2.Final, compiler: IncrementalProcessingEnvironment from gradle-language-java-7.2.jar, environment: Java 17.0.1 (Oracle Corporation)"
)
@Component
public class UserDtoMapperImpl implements UserDtoMapper {

    @Override
    public RegisterUser of(RegisterUserRequest request) {
        if ( request == null ) {
            return null;
        }

        RegisterUserBuilder registerUser = RegisterUser.builder();

        registerUser.username( request.getUsername() );

        return registerUser.build();
    }

    @Override
    public RegisterResponse of(String userToken) {
        if ( userToken == null ) {
            return null;
        }

        RegisterResponseBuilder registerResponse = RegisterResponse.builder();

        registerResponse.userToken( userToken );

        return registerResponse.build();
    }
}
