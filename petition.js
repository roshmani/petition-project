const {
    saveUserSigned,
    getUsersSigned,
    getNumUsers,
    getSignature,
    regUsers,
    checkEmail,
    userProfile,
    selectPetitioners,
    getUserDetails,
    updateUserTable,
    updateUserprofileTable,
    deleteSignature,
    getSignedUserId
} = require("./petitiondbservice");

/* Getting secret key for cookie parser either from file or conf.var in heroku*/
let secret;
if (process.env.secret) {
    secret = process.env.secret;
} else {
    const secrets = require("./secrets.json");
    secret = secrets.secret;
}
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
/*config:body parser*/
app.use(
    require("body-parser").urlencoded({
        extended: false
    })
); // used in POST requests to read value from forms
app.use(
    cookieSession({
        secret: secret,
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
/*---------------------------------------------------------------------*/
/*                             GET Routes                              */
/*---------------------------------------------------------------------*/
/*Route for calling home page*/
app.get("/", function(request, response) {
    response.render("home", { header: true });
});

/*Route for calling registration page*/
app.get("/register", function(request, response) {
    response.render("register", { header: true });
});
/*Route for calling profile*/
app.get("/profile", function(request, response) {
    response.render("profile", { header: false });
});

/*Route for calling login page*/
app.get("/login", function(request, response) {
    response.render("login", { header: true });
});

/*Route for logout -session is cleared*/
app.get("/logout", function(request, response) {
    request.session = null;
    response.redirect("/");
});

/*Route for calling petition signing page-checks if already signed */
/* or user is already registered*/
app.get("/petition", checkforSigned, checkforUserId, function(
    request,
    response
) {
    response.render("petitionMain");
});

/*Route for calling page once user ha signed petition-checks if already signed */
/* or user is already registered*/
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
            console.log(
                "Error occured in db query to getusers and signatures:",
                err
            );
        });
});

/*Routes for editing user profile --gets details of registered user in the form*/
app.get("/profile/edit", function(request, response) {
    const userId = request.session.userId;
    console.log("signid", userId);
    getUserDetails(userId)
        .then(function(userdetails) {
            response.render("profileEdit", {
                userdetails: userdetails.rows[0]
            });
        })
        .catch(function(err) {
            console.log("Error occured in edit profile query:", err);
        });
});

/*Route for getting list of signers who signed the petition-checks if already signed */
/* or user is already registered*/
app.get("/petition/signers", checkforSigid, checkforUserId, function(
    request,
    response,
    next
) {
    getUsersSigned()
        .then(function(petitioners) {
            response.render("signers", {
                petitioners: petitioners.rows,
                cityflag: false,
                signed: true
            });
        })
        .catch(function(err) {
            console.log("Error occured in getting signed users:", err);
        });
});

/*Gets the signers in same city based on the city link clicked*/
app.get("/petition/signers/:city", checkforSigid, checkforUserId, function(
    request,
    response
) {
    let city = request.params.city;
    selectPetitioners(city)
        .then(function(petitioners) {
            response.render("signers", {
                petitioners: petitioners.rows,
                cityflag: true,
                signed: true
            });
        })
        .catch(function(err) {
            console.log("Error occured in gettting signer based on city:", err);
        });
});

/**************************************************************************/
/*                                     POST Routes                        */
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
                console.log("Error occured in register:", err);
                response.render("register", { err: true });
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
                    /*get id for the sign if already signed*/
                    getSignedUserId(idval)
                        .then(function(results) {
                            if (results.rows.length > 0) {
                                request.session.signId = results.rows[0].id;
                                response.redirect("/petition/signed");
                            } else {
                                response.redirect("/petition");
                            }
                        })
                        .catch(function(err) {
                            console.log("Error occured in login:", err);
                            response.render("login", { err: true });
                        });
                } else {
                    throw new Error();
                }
            })
            .catch(function(err) {
                console.log("Error occured in login:", err);
                response.render("login", { err: true });
            });
    } else {
        response.render("login", { err: true });
    }
});
/**********************************************************************/
app.post("/profile", (request, response) => {
    let url = request.body.homepage;
    let cityname = request.body.city;
    if (!url.startsWith("https://") && url.length > 0) {
        url = "https://" + url;
    }

    if (cityname.length > 0) {
        cityname = firstLetterUCase(cityname);
    }

    userProfile(request.body.age, cityname, url, request.session.userId)
        .then(function() {
            response.redirect("/petition");
        })
        .catch(function(err) {
            console.log("Error occured in insert profile:", err);
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
                console.log("Error occured in the petition signed:", err);
                response.status(500);
            });
    } else {
        response.render("petitionMain", { err: true });
    }
});
/***************************************************************************/
app.post("/profile/Edit", (request, response) => {
    const userId = request.session.userId;
    let newurl;
    const { fname, lname, emailid, passwd, age, city, url } = request.body;
    /*city name change case*/
    let cityname = city;
    if (cityname.length > 0) {
        cityname = firstLetterUCase(cityname);
    }

    /*to reload form on error handling*/
    let formVal = {
        fname: request.body.fname,
        lname: request.body.lname,
        email: request.body.emailid,
        passwd: request.body.passwd,
        age: request.body.age,
        city: cityname,
        url: request.body.url
    };
    /*check for protocol addition*/
    if (!url.startsWith("https://") && url.length > 0) {
        newurl = "https://" + url;
    } else {
        newurl = url;
    }
    if (passwd) {
        hashPass(passwd)
            .then(function(hashedpwd) {
                /*call function to update with the new hash*/
                Promise.all([
                    updateUserTable(fname, lname, emailid, userId, hashedpwd),
                    updateUserprofileTable(age, cityname, newurl, userId)
                ])
                    .then(function() {
                        response.redirect("/petition/signed");
                    })
                    .catch(function(err) {
                        console.log("Error occured in db query:", err);
                        response.render("profileEdit", {
                            err: true,
                            userdetails: formVal
                        });
                    });
            })
            .catch(function(err) {
                console.log("Error occured in hashing password:", err);
            });
    } else {
        /*call function to update without pwd*/
        Promise.all([
            updateUserTable(fname, lname, emailid, userId),
            updateUserprofileTable(age, cityname, newurl, userId)
        ])
            .then(function() {
                response.redirect("/petition/signed");
            })
            .catch(function(err) {
                console.log("Error occured in db query:", err);
                response.render("profileEdit", {
                    err: true,
                    userdetails: formVal
                });
            });
    }
});
/***************************************************************************/
app.post("/delete", (request, response) => {
    const signId = request.session.signId;
    deleteSignature(signId)
        .then(function(results) {
            request.session.signId = null;
            response.redirect("/petition");
        })
        .catch(function(err) {
            console.log("Error occured on delete:", err);
        });
});

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
/* function is to convert city name to lowercase and makes the first letter to uppercase*/
function firstLetterUCase(cityname) {
    let camelCasename = cityname.toLowerCase();
    camelCasename =
        camelCasename.charAt(0).toUpperCase() + camelCasename.slice(1);
    return camelCasename;
}
/**********************************************************************/
app.listen(process.env.PORT || 8080, () =>
    console.log("listening on port 8080...")
);
