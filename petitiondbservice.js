var spicedpg = require("spiced-pg");

var db = spicedpg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.saveUserSigned = function(fname, lname, signature) {
	var query = `INSERT INTO Signatures(fname,lname,sign) VALUES($1,$2,$3)`;

	return db.query(query, [fname || null, lname || null, signature || null]);
};

module.exports.getUsersSigned = function() {
	var query = `SELECT FNAME FROM Signatures`;
	return db.query(query);
};

module.exports.getNumUsers = function() {
	var query = `SELECT COUNT(*) FROM Signatures`;
	return db.query(query);
};
