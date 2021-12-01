package com.side.boothoney.domain.user;

import com.side.boothoney.common.exception.InvalidParamException;
import com.side.boothoney.domain.AbstractEntity;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Getter
@Entity
@NoArgsConstructor
@Table(name = "tb_role")
public class Role extends AbstractEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Builder
    public Role(String name) {
        if (name == null) throw new InvalidParamException("Role.name");

        this.name = name;
    }
}
