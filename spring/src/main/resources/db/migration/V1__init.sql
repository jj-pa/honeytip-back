-- user
create table tb_user
(
    id bigint auto_increment primary key comment 'ID',
    user_token varchar(255) not null comment 'user_token',
    email varchar(255) null,
    username varchar(255) null,
    kakao_id varchar(255) null,
    password varchar(255) null,
    phone_number varchar(255) null,
    current_hashed_refresh_token varchar(255) null,
    created_at datetime(6) not null comment '생성일시',
    updated_at datetime(6) null comment '수정일시'
);
create index user_idx01 on tb_user (user_token);
create index user_idx02 on tb_user (created_at);
create index user_idx03 on tb_user (updated_at);
