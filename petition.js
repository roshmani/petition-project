const {
	saveUserSigned,
	getUsersSigned,
	getNumUsers,
	getSignature
} = require("./petitiondbservice");
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
/***********************************************************************/
app.use(express.static("static"));

app.get("/petition", checkforSigned, function(request, response) {
	response.render("petitionMain");
});

app.get("/petition/signed", checkforSigid, function(request, response, next) {
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
		});
});

app.get("/petition/signers", checkforSigid, function(request, response, next) {
	getUsersSigned()
		.then(function(petitioners) {
			response.render("signers", {
				petitioners: petitioners.rows
			});
		})
		.catch(function(err) {
			console.log("Error occured:", err);
		});
});

app.post("/petition", (request, response) => {
	if (request.body.fname && request.body.lname && request.body.sign) {
		saveUserSigned(
			request.body.fname,
			request.body.lname,
			request.body.sign
		)
			.then(function(sign) {
				request.session.signId = sign.rows[0].id;
				response.redirect("/petition/signed");
			})
			.catch(function(err) {
				console.log("Error occured:", err);
			});
	} else {
		response.render("petitionMain", { err: true });
	}
});

function checkforSigid(request, response, next) {
	if (!request.session.signId && request.url != "/petition") {
		response.redirect("/petition");
	} else {
		next();
	}
}

function checkforSigned(request, response, next) {
	if (request.session.signId && request.url != "/petition/signed") {
		console.log("in petition check");
		response.redirect("/petition/signed");
	} else {
		next();
	}
}
/**********************************************************************/
app.listen(8080, () => console.log("listening on port 8080..."));
