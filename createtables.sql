DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id SERIAL primary key,
    FNAME VARCHAR(255) not null,
    LNAME VARCHAR(255) not null,
    email VARCHAR(255) not null UNIQUE,
    password  VARCHAR(255) not NULL
);

DROP TABLE IF EXISTS user_profiles;
CREATE TABLE user_profiles (
    profid SERIAL primary key,
    AGE INTEGER DEFAULT 0,
    CITY VARCHAR(255),
    URL VARCHAR(255),
    user_id INTEGER REFERENCES users(id)
);

DROP TABLE IF EXISTS Signatures;
CREATE TABLE Signatures (
    id SERIAL primary key,
    FNAME VARCHAR(255) not null,
    LNAME VARCHAR(255) not null,
    SIGN TEXT not null,
    user_id INTEGER REFERENCES users(id)
);
