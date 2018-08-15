DROP TABLE IF EXISTS Signatures;
CREATE TABLE Signatures (
    id SERIAL primary key,
    FNAME VARCHAR(255) not null,
    LNAME VARCHAR(255) not null,
    SIGN TEXT not null
);
