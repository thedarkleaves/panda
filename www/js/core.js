debug = true;

function printdebug(content) {
    if (debug) {
        $("#debug").append("<br>"+content);
    }
}

// TODO: make this better 
function popupmessage(content) {
    printdebug(content);
}


function startLogin() {
    printdebug("the login function has been called.");      
    // start login
    // check passwords
    password1 = $("#newuser_password").val();
    password2 = $("#newuser_passwordconfirm").val();
    if (password1==password2) {
        // passwords match
        email = $("#newuser_email").val();
        // create user
        firebase.auth().createUserWithEmailAndPassword(email, password1).catch(function(error) {
        // catch errors
        var errorCode = error.code;
        var errorMessage = error.message;
        printdebug("Auth Error: " + errorCode + " " + errorMessage);
        });
        printdebug("created user");
    } else {
        popupmessage("passwords don't match");
    }
}

var db;
var userid;
var paindiary = [];
var todaylogged = false;

function updatepaindiary() {
    // read the pain diary for this user
    db.collection("users").doc(userid).collection("diary").get().then(function(webpaindairy) {
            webpaindairy.forEach(function(painday) {
            var thispainday = new Object();
            thispainday.date=painday.id;
            if (painday.id==todayString()) {
                todaylogged = true;
                console.log("today already logged");
                $("#logtoday").hide();
            }
            thispainday.painscore=painday.data().painscore;
            thispainday.painhours=painday.data().painhours;
            thispainday.otherfactors=painday.data().otherfactors;
            thispainday.medications=painday.data().medications;
            paindiary.push(thispainday);
            console.log('recieved paindata ' + thispainday.date)
        });
        initPainChart(7,0);
    });
}


function changescreen(screenname) {
    $(".screen").fadeOut(screenspeed/2);
    $("#" + screenname).show(screenspeed);
    if (screenname=="home") {
        if (todaylogged) {
            $("#logtoday").hide();
        }
    }
    if (screenname=="paindiary3") {
        $("#painhoursquestion").append("for how many hours was your pain more than " + painscore + " out of 10?");
    }
    
}

// application constructor
var app = {
    initialise: function() {
    printdebug("initialising app object");
        this.bindEvents(); 
    },
    // bind event listeners 
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready event handler
    onDeviceReady: function() {
        printdebug("initialising firebase");
        // firebase config
        var firebaseConfig = {
            apiKey: "AIzaSyAnj7PINJSyw5HuwTV-_9RBaNpnAJzGlLQ",
            authDomain: "ouch-beta-mobile.firebaseapp.com",
            databaseURL: "https://ouch-beta-mobile.firebaseio.com",
            projectId: "ouch-beta-mobile",
            storageBucket: "ouch-beta-mobile.appspot.com",
            messagingSenderId: "380054382603",
            appId: "1:380054382603:web:8c178d048c771515"
        };
        // initialize firebase
        firebase.initializeApp(firebaseConfig);    
 
        // catch attempted log in
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // logged in successfully
                $("#welcome").append(" " + user.displayName);
                $("#home").show(screenspeed);
                db = firebase.firestore();
                $("#hamburger").show();
                $("#topbar").click(function(){
                    changescreen("home");
                });
                // check if user is new or existing
                var currentuserref = db.collection("users").doc(user.uid);
                currentuserref.get().then(function(currentuser) {
                    if (currentuser.exists) {
                        console.log("logged in as :", currentuser.data().name);
                        userid=user.uid;
                        $("#nhi").val(currentuser.data().NHI); console.log(currentuser.data().NHI);
                        $("#researchid").val(currentuser.data().studyid);
                        updatepaindiary();
                    } else {
                        // add the user to the database
                        console.log("new user");
                        db.collection("users").doc(user.uid).set({
                            name: user.displayName,
                            uid: user.uid,
                            NHI:null,
                            studyid:null
                        })
                        .then(function(docRef) {
                            printdebug("New user added: ", user.displayName);
                        })
                        .catch(function(error) {
                            printdebug("Error adding new user: ", error);
                        });
                        userid=user.uid;
                    }
                }).catch(function(error) {
                    printdebug("Error loading users:", error);
                });
            } else {
                printdebug("Not signed in");
                // Initialize the FirebaseUI Widget using Firebase.
                var ui = new firebaseui.auth.AuthUI(firebase.auth());
                var uiConfig = {
                    callbacks: {
                        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                            // User successfully signed in.
                            // Return type determines whether we continue the redirect automatically
                            // or whether we leave that to developer to handle.
                            return true;
                        },
                        uiShown: function() {
                            // The widget is rendered.
                            // Hide the loader.
                            document.getElementById('loader').style.display = 'none';
                        }
                    },
                    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
                    signInFlow: 'redirect',
                    signInSuccessUrl: 'index.html',
                    signInOptions: [
                        // Leave the lines as is for the providers you want to offer your users.
                        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                        firebase.auth.FacebookAuthProvider.PROVIDER_ID
                    ],
                    // Terms of service url.
                    tosUrl: 'tos.html',
                    // Privacy policy url.
                    privacyPolicyUrl: 'privacy.html'
                };
                ui.start('#firebaseui-auth-container', uiConfig);
                changescreen("authenticator");
                $("#firebaseui-auth-container").show();
            }
        });

        // initialise
        $(".screen").hide();
        
        // set up buttons
        // #home
        $("#logtoday").click(function(){
            changescreen("paindiary1");
        });
        
        // #controls
        $("#hamburger").click(function() {
            changescreen("controls");
        });
        $("#signout").click(function() {
            firebase.auth().signOut().then(function() {
                console.log('Signed Out');
                window.location.reload();
            }, function(error) {
                console.error('Sign Out Error', error);
            });
        });
        
        $("#paindiary_button").click(function(){
            printpaindiary();
            changescreen("paindiarysummary");
        });
        $("#home_button").click(function(){
            changescreen("home");
        });
        $("#settings_button").click(function(){
            changescreen("settings");
        });
        
        
        // print the pain diary
        function printpaindiary() {
            $("#paindiarysummary").empty()
            for (i=paindiary.length-1;i>=0;i--) {
                $("#paindiarysummary").append("<span><b>"+formatdate(paindiary[i].date)+"</b><br></span>");
                $("#paindiarysummary").last().append("pain score: " + paindiary[i].painscore+"<br>");
                $("#paindiarysummary").last().append("pain hours: " + paindiary[i].painhours+"<br>");
                if (paindiary[i].otherfactors != undefined) {
                    $("#paindiarysummary").last().append("factors:");
                    for (j=0;j<paindiary[i].otherfactors.length;j++) {
                        $("#paindiarysummary").last().append(paindiary[i].otherfactors[j] + ", ");
                    }
                }
                if (paindiary[i].medications != undefined) {
                    $("#paindiarysummary").last().append("<br>medications:");
                    for (j=0;j<paindiary[i].medications.length;j++) {
                        $("#paindiarysummary").last().append(paindiary[i].medications[j].name + " " + paindiary[i].medications[j].dose + " x " + paindiary[i].medications[j].mednum + ", ");
                    }
                }
                $("#paindiarysummary").last().append("<hr>");
            }
        }

        // #paindiary1
        $("#todaypainyes").click(function(){
            changescreen("paindiary2");
        });

        $("#todaypainno").click(function(){
            // Log no pain today
            db.collection("users").doc(userid).collection("diary").doc(todayString()).set({
                "painscore": 0,
                "painhours": 0,
            })
            .then(function(docRef) {
                console.log("New pain diary added");
            })
            .catch(function(error) {
                console.error("Error adding pain diary: ", error);
            });
            todaylogged=true;
            updatepaindiary();
            changescreen("home");
        });

        // #paindiary2
        $(".1to10").click(function(){
            changescreen("paindiary3");
        });

        // #paindiary3
        $(".1to24").click(function(){
            changescreen("paindiary4");
        });

        // #paindiary 4
        function applyotherinfotoggleclick () {
            $("#paindiary4 .toggle").off("click");
            $("#paindiary4 .toggle").click(function(){
                $(this).toggleClass('toggletrue');
                if ($(this).hasClass('toggletrue')) {
                    otherinfo.push($(this).text());
                } else {
                    otherinfo.splice(otherinfo.indexOf($(this).text()),1);
                }
            });
        }
        applyotherinfotoggleclick();

        $('#oknewotherinfo').hide();
        $("#newotherinfo").click(function(){
            $(this).val('');
            $("#oknewotherinfo").show();
        });
        $("#oknewotherinfo").click(function(){
            $("#oknewotherinfo").hide();
            $('#newotherinfo').before('<button class="toggle">' + $('#newotherinfo').val() + '</button>');
            applyotherinfotoggleclick();
            $('#paindiary4 .toggle').last().click();
            $('#newotherinfo').val('other');
        });
        
        $("#finish4").click(function(){
            changescreen("meddiary1");
        });


        // med diary 1
        $(".toggle.dose").hide();
        $(".mednum").hide();
        function applymedtoggleclick () {
            $("#meddiary1 .toggle").off("click");
            $("#meddiary1 .toggle").click(function(){
                $(this).toggleClass('toggletrue');
                if ($(this).hasClass('toggletrue')) {
                    dosebutton=$(this).next();
                    while (dosebutton.hasClass("dose")) {
                        dosebutton.show();
                        dosebutton=dosebutton.next();
                    }
                    $(".toggle.dose").off("click");
                    $(".toggle.dose").click(function(){
                        $(this).toggleClass('toggletrue');
                        somebutton=$(this).prev();
                        // turn off other doses and find the mednum button
                        while (!somebutton.hasClass("med")) {
                            somebutton=somebutton.prev();
                        } // somebutton is the previous medication button
                        somebutton=somebutton.next();
                        while (!somebutton.hasClass("mednum")) {
                            somebutton.removeClass('toggletrue');
                            somebutton=somebutton.next();
                        };
                        $(this).toggleClass('toggletrue');
                        somebutton.show();
                        somebutton.click(function(){
                            $(this).val('');
                        });
                    });
                } else {
                    // hide all the dose buttons and num input
                    nextbit = $(this).next();
                    while (!nextbit.hasClass('endmed')) {
                        nextbit.hide();
                        nextbit=nextbit.next();
                    }
                }
            });
        }
        applymedtoggleclick();

        $("#finishmed1").click(function(){
            // collect all logged meds
            var medsused = [];
            $('.med.toggletrue').each(function() {
                
                thismed = {};
                thismed.name = $(this).text();
                // check if a dose was selected
                var dosebutton = $(this).next();
                while (dosebutton.hasClass("dose")) {
                    if (dosebutton.hasClass("toggletrue")) {
                        thismed.dose=dosebutton.text();
                        break;
                    } else {
                        dosebutton = dosebutton.next();
                    }
                }
                while (!dosebutton.hasClass("mednum")) {
                    dosebutton=dosebutton.next();
                } 
                if (dosebutton.val()!="how many?") {
                    thismed.mednum=dosebutton.val();
                } // caution this needs updating if the question changes
                medsused.push(thismed);
            });

            var medslist = "";
            for (i=0;i<medsused.length;i++) {
                medslist += medsused[i].name + ", ";
            }
            medslist = medslist.substr(0,medslist.length-2); // get rid of the last comma

            db.collection("users").doc(userid).collection("diary").doc(todayString()).set({
                "painscore": painscore,
                "painhours": painhours,
                "otherfactors": otherinfo,
                "medications": medsused
            })
            .then(function(docRef) {
                console.log("New pain diary added");
            })
            .catch(function(error) {
                console.error("Error adding pain diary: ", error);
            });
            updatepaindiary();
            printpaindiary();
            changescreen("paindiarysummary");
            todaylogged=true;
        });

        $("#submitsettings").click(function(){
            db.collection("users").doc(userid).update({
                NHI: $("#nhi").val(),
                studyid: $("#researchid").val()
            });
            changescreen("home");
        });

        printdebug("ready");
    },
};



