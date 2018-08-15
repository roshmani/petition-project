const {
	saveUserSigned,
	getUsersSigned,
	getNumUsers
} = require("./petitiondbservice");
const express = require("express");
const app = express();
app.use(require("cookie-parser")());
app.use(
	require("body-parser").urlencoded({
		extended: false
	})
); // used in POST requests
const hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
/***********************************************************************/
app.use(express.static("static"));

app.get("/petition", function(request, response) {
	response.render("petitionMain");
});

app.get("/petition/signed", function(request, response, next) {
	//checkforCookies(request, response, next);
	getNumUsers()
		.then(function(numSigners) {
			response.render("Signed", {
				numSigners: numSigners.rows[0].count
			});
		})
		.catch(function(err) {
			console.log("Error occured:", err);
		});
});

app.get("/petition/signers", function(request, response, next) {
	//checkforCookies(request, response, next);
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
			.then(function() {
				response.cookie("signed", true);
				response.redirect("/petition/signed");
			})
			.catch(function(err) {
				console.log("Error occured:", err);
			});
	} else {
		response.render("petitionMain", { err: true });
	}
});

function checkforCookies(request, response, next) {
	if (!request.cookies.signed && request.url != "/petition") {
		response.redirect("/petition");
	} else {
		next();
	}
}
/**********************************************************************/
app.listen(8080, () => console.log("listening on port 8080..."));
