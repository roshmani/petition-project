const {
	saveUserSigned,
	getUsersSigned,
	getNumUsers,
	getSignature,
	regUsers,
	checkEmail,
	userProfile,
	selectPetitioners,
	getUserDetails
} = require("./petitiondbservice");
const { checkPass, hashPass } = require("./PwdEncryption");
const express = require("express");
const csurf = require("csurf");
const cookieSession = require("cookie-session");
const app = express();
const hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
app.use(require("cookie-parser")());
app.disable("x-powered-by");
app.use(
	require("body-parser").urlencoded({
		extended: false
	})
); // used in POST requests
app.use(
	cookieSession({
		secret: `Highly Confidential`,
		maxAge: 1000 * 60 * 60 * 24 * 14
	})
);
app.use(csurf());
app.use((request, response, next) => {
	response.locals.csrfToken = request.csrfToken();
	next();
});
app.engine("handlebars", hb({ defaultLayout: "main" }));
/***********************************************************************/
app.use(express.static("static"));

app.get("/home", function(request, response) {
	response.render("home");
});

/*Route for calling registration page*/
app.get("/register", function(request, response) {
	response.render("register");
});
/*Route for calling profile*/
app.get("/profile", function(request, response) {
	response.render("profile");
});

app.get("/login", function(request, response) {
	response.render("login");
});

app.get("/petition", checkforSigned, checkforUserId, function(
	request,
	response
) {
	response.render("petitionMain");
});

app.get("/petition/signed", checkforSigid, checkforUserId, function(
	request,
	response,
	next
) {
	const signId = request.session.signId;
	Promise.all([getNumUsers(), getSignature(signId)])
		.then(function(results) {
			response.render("Signed", {
				numSigners: results[0].rows[0].count,
				signature: results[1].rows[0].sign
			});
		})
		.catch(function(err) {
			console.log("Error occured:", err);
			response.status(500);
		});
});

app.get("/profile/edit", function(request, response) {
	const signId = request.session.signId;
	console.log("signid", signId);
	getUserDetails(signId)
		.then(function(userdetails) {
			console.log("det:", userdetails.rows);
			response.render("profileEdit", {
				userdetails: userdetails.rows[0]
			});
		})
		.catch(function(err) {
			console.log("Error occured:", err);
		});
});

app.get("/petition/signers", checkforSigid, checkforUserId, function(
	request,
	response,
	next
) {
	getUsersSigned()
		.then(function(petitioners) {
			response.render("signers", {
				petitioners: petitioners.rows,
				cityflag: false
			});
		})
		.catch(function(err) {
			console.log("Error occured:", err);
		});
});

app.get("/petition/signers/:city", checkforSigid, checkforUserId, function(
	request,
	response
) {
	let city = request.params.city;
	selectPetitioners(city)
		.then(function(petitioners) {
			response.render("signers", {
				petitioners: petitioners.rows,
				cityflag: true
			});
		})
		.catch(function(err) {
			console.log("Error occured:", err);
		});
});

/**************************************************************************/
app.post("/register", (request, response) => {
	if (
		request.body.fname &&
		request.body.lname &&
		request.body.emailid &&
		request.body.passwd
	) {
		hashPass(request.body.passwd)
			.then(function(hashedpwd) {
				return regUsers(
					request.body.fname,
					request.body.lname,
					request.body.emailid,
					hashedpwd
				);
			})
			.then(function(userid) {
				request.session.userId = userid.rows[0].id;
				response.redirect("/profile");
			})
			.catch(function(err) {
				console.log("Error occured:", err);
				response.status(500);
			});
	} else {
		response.render("register", { err: true });
	}
});
/******************************************************************************/
app.post("/login", (request, response) => {
	let idval;
	if (request.body.emailid && request.body.pswd) {
		checkEmail(request.body.emailid)
			.then(function(results) {
				if (results.rows.length > 0) {
					idval = results.rows[0].id;
					return checkPass(
						request.body.pswd,
						results.rows[0].password
					);
				} else {
					throw new Error();
				}
			})
			.then(function(match) {
				if (match) {
					request.session.userId = idval;
					response.redirect("/petition");
				} else {
					throw new Error();
				}
			})
			.catch(function(err) {
				console.log("Error occured:", err);
				response.render("login", { err: true });
			});
	} else {
		response.render("login", { err: true });
	}
});
/**********************************************************************/
app.post("/profile", (request, response) => {
	let url = request.body.homepage;
	if (!url.startsWith("https://")) {
		url = "https://" + url;
	}
	userProfile(
		request.body.age,
		request.body.city,
		url,
		request.session.userId
	)
		.then(function() {
			response.redirect("/petition");
		})
		.catch(function(err) {
			console.log("Error occured:", err);
			response.render("profile", { err: true });
		});
});

/**********************************************************************/
app.post("/petition", (request, response) => {
	if (request.body.sign) {
		let userid = request.session.userId;
		saveUserSigned(request.body.sign, userid)
			.then(function(sign) {
				request.session.signId = sign.rows[0].id;
				response.redirect("/petition/signed");
			})
			.catch(function(err) {
				console.log("Error occured:", err);
				response.status(500);
			});
	} else {
		response.render("petitionMain", { err: true });
	}
});
/***************************************************************************/
app.post("/profile/Edit", (request, response) => {});
/**********************************middle wares*****************************/
function checkforSigid(request, response, next) {
	if (!request.session.signId) {
		response.redirect("/petition");
	} else {
		next();
	}
}

function checkforSigned(request, response, next) {
	if (request.session.signId) {
		response.redirect("/petition/signed");
	} else {
		next();
	}
}

function checkforUserId(request, response, next) {
	if (!request.session.userId) {
		response.redirect("/register");
	} else {
		next();
	}
}
/**********************************************************************/
app.listen(8080, () => console.log("listening on port 8080..."));
