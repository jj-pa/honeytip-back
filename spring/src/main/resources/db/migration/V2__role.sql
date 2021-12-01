-- role
create table tb_role
(
    id bigint auto_increment primary key comment 'ID',
    name varchar(255) not null comment 'Role',
    created_at datetime(6) not null comment '생성일시',
    updated_at datetime(6) null comment '수정일시'
);