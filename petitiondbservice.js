var spicedpg = require("spiced-pg");

var db = spicedpg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.saveUserSigned = function(fname, lname, signature) {
	var query = `INSERT INTO Signatures(fname,lname,sign) VALUES($1,$2,$3) RETURNING id`;

	return db.query(query, [fname || null, lname || null, signature || null]);
};

module.exports.getUsersSigned = function() {
	var query = `SELECT FNAME,LNAME FROM Signatures`;
	return db.query(query);
};

module.exports.getNumUsers = function() {
	var query = `SELECT COUNT(*) FROM Signatures`;
	return db.query(query);
};

module.exports.getSignature = function(signId) {
	var query = `SELECT sign FROM Signatures WHERE id=$1`;
	return db.query(query, [signId]);
};
