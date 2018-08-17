var spicedpg = require("spiced-pg");

var db = spicedpg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.saveUserSigned = function(fname, lname, signature, userid) {
	var query = `INSERT INTO Signatures(fname,lname,sign,user_id) VALUES($1,$2,$3,$4) RETURNING id`;

	return db.query(query, [
		fname || null,
		lname || null,
		signature || null,
		userid || null
	]);
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

module.exports.regUsers = function(fname, lname, email, password) {
	var query = `INSERT INTO users(fname,lname,email,password) VALUES($1,$2,$3,$4) RETURNING id`;

	return db.query(query, [
		fname || null,
		lname || null,
		email || null,
		password || null
	]);
};

module.exports.checkEmail = function(emailid) {
	var query = `SELECT * FROM users WHERE email=$1`;
	return db.query(query, [emailid]);
};
