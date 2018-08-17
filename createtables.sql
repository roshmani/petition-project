DROP TABLE IF EXISTS Signatures;
CREATE TABLE Signatures (
    id SERIAL primary key,
    FNAME VARCHAR(255) not null,
    LNAME VARCHAR(255) not null,
    SIGN TEXT not null,
    user_id INTEGER not NULL
);
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id SERIAL primary key,
    FNAME VARCHAR(255) not null,
    LNAME VARCHAR(255) not null,
    email VARCHAR(255) not null UNIQUE,
    password  VARCHAR(255) not NULL
);
