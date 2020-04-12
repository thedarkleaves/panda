import { _ } from "core-js";

// global variables
var debug = true;
var screenspeed=1000;
var painscore;
var painhours;
var db;
var userid;
var username;
var encryptionkey;
var encryptor;
var paindiary;
var providers = [];
var todaylogged = false;
var otherinfo = [];
var otherinfooptions = ["period","diarrhoea","constipated","stressed"];
var meds = {
    "medication": [
        {
            "name":"paracetamol",
            "type":"simple",
            "dose": ["500mg"]
        },
        {
            "name":"ibuprofen",
            "type":"anti-inflammatory",
            "dose":["200mg"]
        },
        {
            "name":"codeine",
            "type":"opioid",
            "dose":["30mg","60mg"]
        },
        {
            "name":"tramadol",
            "type":"opioid",
            "dose":["50mg"]
        }
    ]
};

function formatdate(datestring) {
    splitdate=datestring.split('.');
    return(splitdate[2]+'/'+splitdate[1]+'/'+splitdate[0]);
}
function todayString() {
    var today = new Date();
    var monthstring, datestring;
    // pad with zeros
    if (today.getMonth()<9) {
        monthstring = "0" + (today.getMonth()+1);
    } else {
        monthstring = (today.getMonth()+1);
    }
    if (today.getDate()<10) {
        datestring = "0" + today.getDate();
    } else {
        datestring = today.getDate();
    }
    return (today.getFullYear() + "." + monthstring + "." + datestring);
}

function printdebug(content) {
    if (debug) {
        $("#debug").append("<br>"+content);
    }
}

// TODO: make this better 
function popupmessage(content) {
    printdebug(content);
}

function updatepaindiary() {
    db.collection("users").doc(userid).collection("providers").get().then(function(providerlist) {
        printdebug("Loaded provider list");
    });
    // read the pain diary for this user
    paindiary = [];
    db.collection("users").doc(userid).collection("diary").get().then(function(webpaindiary) {
        webpaindiary.forEach(function(painday) {
            var thispainday = new Object();
            thispainday.date=painday.id;
            if (painday.id==todayString()) {
                todaylogged = true;
                printdebug("today already logged");
                $("#logtoday").hide();
            }
            thispainday.painscore=painday.data().painscore;
            thispainday.painhours=painday.data().painhours;
            thispainday.otherfactors=painday.data().otherfactors;
            addOtherFactors(thispainday.otherfactors);
            thispainday.medications=painday.data().medications;
            paindiary.push(thispainday);
            printdebug('received paindata ' + thispainday.date);
        });
        printpaindiary();
        printdebug("Trying to create pain chart.");
        initPainChart(7,0);
        makePainDiary4();
    });
}

function addprovider(providerid) {
    $('#providers').empty().append("updating...");
    // look up the provider details
    db.collection("providers").doc(providerid).get().then(function(providerdetails) {
        if (providerdetails.exists) {
            db.collection("users").doc(userid).collection("providers").doc(providerid).set({
                "options": "none"
            }).then(function(docref) {
                updateproviders();
            }).catch(function(error){
                printdebug('error adding provider ' + providerid + ": " + error);
            });
        } else {
            // provider not found
            updateproviders();
            $("#providers").append("<div>provider code not found</div>");
        }
    }).catch(function(error) {
        printdebug('error getting provider ' + error);
    });
}


function updateproviders() {
    printdebug('update providers function running');
    // read the healthcare providers for this user
    $("#providers").empty();
    $("#providers").append('<button id="addproviderbutton">add provider</button><br>');
    $("#addproviderbutton").click(function() {
        $("#addproviderbutton").after('<input id="addprovidercode" placeholder="code" type="text"> ');
        $("#addprovidercode").after('<button id="confirmaddprovider">add</button><br>');
        $("#confirmaddprovider").click(function(){
            var checkmessage = "Are you sure you want to give this provider access to your data?";
            // TODO: CHECK IF THE NEXT LINE  WORKS??!
            checkUserReallyWantsToContinue(checkmessage,function(){
                addprovider($("#addprovidercode").val());
            });
        });
        $("#addproviderbutton").remove();
    });
    $("#providers").append('<div id="tempproviderloading">loading...</div>');
    db.collection("users").doc(userid).collection("providers").get().then(function(providerlist) {
        printdebug("Loaded provider list appropriately");
        providers = [];
        providerlist.forEach(function(provider) {
            var thisprovider = new Object();
            thisprovider.id = provider.id;
            db.collection("providers").doc(thisprovider.id).get().then(function(providerdetails) {
                thisprovider.name = providerdetails.data().name;
                thisprovider.practice = providerdetails.data().practice;
                providers.push(thisprovider);
                printdebug("Provider " + thisprovider.name + " loaded.");
                $("#providers").append('<div class="provider">' + thisprovider.name  + ' <span class="practice">' + thisprovider.practice + '</span></div>');
                $(".provider").last().append('<button>remove</button>');
                $(".provider button").last().click(function() {
                    removeProvider(thisprovider.id);
                });
            });
        });
        $("#tempproviderloading").remove();
    }).catch(function(error) {
        printdebug("error loading providers: " + error);
    });
}

function removeProvider(providerid) {
    $('#providers').empty().append("updating...");
    printdebug('attempting to remove provider ' + providerid);
    db.collection("users").doc(userid).collection("providers").doc(providerid).delete().then(function() {
        updateproviders();
        $('#providers').append('Provider Removed. <button>undo</button><br>');
        $('#providers button').last().click(function() {
            addprovider(providerid);
        });
    }).catch(function(error){
        printdebug('error deleting provider ' + providerid + ": " + error);
    });
}


function updatestudies() {
    printdebug('update studies function running');
    // read the studies for this user
    $("#studies").empty();
    $("#studies").append('<button id="addstudybutton">add study</button><br>');
    $("#addstudybutton").click(function() {
        $("#addstudybutton").after('<input id="addstudycode" placeholder="code" type="text"> ');
        $("#addstudycode").after('<button id="confirmaddstudy">add</button><br>');
        $("#confirmaddstudy").click(function(){
            addstudy($("#addstudycode").val());
        });
        $("#addstudybutton").remove();
    });
    $("#studies").append('<div id="tempstudyloading">loading...</div>');
    db.collection("users").doc(userid).collection("studies").get().then(function(studylist) {
        printdebug("Loaded study list appropriately");
        studies = [];
        studylist.forEach(function(study) {
            var thisstudy = new Object();
            thisstudy.id = study.id;
            db.collection("studies").doc(thisstudy.id).get().then(function(studydetails) {
                thisstudy.name = studydetails.data().name;
                studies.push(thisstudy);
                printdebug("Study " + thisstudy.name + " loaded.");
                $("#studies").append('<div class="study">' + thisstudy.name  + '</div>');
                $(".study").last().append('<button>remove</button>');
                $(".study button").last().click(function() {
                    removeStudy(thisstudy.id);
                });
            });
        });
        $("#tempstudyloading").remove();
    }).catch(function(error) {
        printdebug("error loading study: " + error);
    });
}

function removeStudy(studyid) {
    $('#studies').empty().append("updating...");
    printdebug('attempting to remove study ' + studyid);
    db.collection("users").doc(userid).collection("studies").doc(studyid).delete().then(function() {
        updatestudies();
        $('#studies').append('Sudy Removed. <button>undo</button><br>');
        $('#studies button').last().click(function() {
            addstudy(studyid);
        });
    }).catch(function(error){
        printdebug('error deleting study ' + studyid + ": " + error);
    });
}

function addstudy(studyid) {
    $('#studies').empty().append("updating...");
    // look up the provider details
    db.collection("studies").doc(studyid).get().then(function(studydetails) {
        if (studydetails.exists) {
            db.collection("users").doc(userid).collection("studies").doc(studyid).set({
                "options": "none"
            }).then(function(docref) {
                updatestudies();
            }).catch(function(error){
                printdebug('error adding study ' + studyid + ": " + error);
            });
        } else {
            // provider not found
            updatestudies();
            $("#studies").append("<div>study code not found</div>");
        }
    }).catch(function(error) {
        printdebug('error getting study ' + error);
    });
}


function addOtherFactors(newOtherFactors) {
    if (newOtherFactors!=undefined) {
        for (i=0;i<newOtherFactors.length;i++) {
            // put the factor at the front of the list
            otherinfooptions.splice(0,0,newOtherFactors[i].toLowerCase());
            // remove it from anywhere else in the list
            for (j=1;j<otherinfooptions.length;j++) {
                if (otherinfooptions[0] == otherinfooptions[j]) {
                    otherinfooptions.splice(j,1);
                    break;
                }
            }
        }
    }
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

function checkUserReallyWantsToContinue(message,functioniftrue) {
    printdebug("Confirm Function Running");
    $("#confirmbox").show();
    $(".confirmboxfront").html(message + "<br>");
    $(".confirmboxfront").append("<button>go ahead</button> <button>don't do it</button>");
    $(".confirmboxfront button:first-child").click(function() {
        $(".confirmboxfront").html("");
        $("#confirmbox").hide();
        functioniftrue();
    });
    $(".confirmboxfront button:last-child").click(function() {
        $(".confirmboxfront").html("");
        $("#confirmbox").hide();
    });
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
                //$("#welcome").append(" " + user.displayName);
                //$("#welcome").append(" " + user.displayName);
                $("#home").show(screenspeed);
                db = firebase.firestore();
                $("#hamburger").show();
                $("#topbar").click(function(){
                    changescreen("home");
                });
                // get the encryption key (global)
                var keyobject = db.collection("keys").doc("phoneapp");
                keyobject.get().then(function(phoneappkey) {
                    if (phoneappkey.exists) {
                        encryptionkey = phoneappkey.data().key;
                    }
                    encryptor = new SimpleCrypto(encryptionkey);
                    // check if user is new or existing
                    var currentuserref = db.collection("users").doc(user.uid);
                    currentuserref.get().then(function(currentuser) {
                        if (currentuser.exists) {
                            userid=user.uid;
                            username=encryptor.decrypt(currentuser.data().name);
                            printdebug("logged in as :" + username);
                            $("#nhi").val(encryptor.decrypt(currentuser.data().NHI));
                            $("#researchid").val(currentuser.data().studyid);
                            updatepaindiary();
                            updateproviders();
                            updatestudies();
                        } else {
                            // add the user to the database
                            console.log("new user");
                            db.collection("users").doc(user.uid).set({
                                name: encyptor.encrypt(user.displayName),
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
        for (i=0;i<=10;i++) {
            $("#paindiary2").append('<button class="1to10" id="painscore'+i+'">'+i+'</button>');
            $("#painscore"+i).click(function(){
                painscore=$(this).attr("id").split("painscore")[1];
            });
        }
        $(".1to10").click(function(){
            changescreen("paindiary3");
        });

        // #paindiary3
        for (i=1;i<=24;i++) {
            $("#paindiary3").append('<button class="1to24" id="painhours'+i+'">'+i+'</button>');
            $("#painhours"+i).click(function(){
                painhours=$(this).attr("id").split("painhours")[1];
            });
        }
        $(".1to24").click(function(){
            changescreen("paindiary4");
        });

        // #paindiary 4 deferred until paindiary loaded

        // med diary 1
        for (i=0;i<meds.medication.length;i++) {
            $("#meddiary1").append('<button class="toggle med">'+meds.medication[i].name,+'</button>');
            for (j=0;j<meds.medication[i].dose.length;j++) {
                $("#meddiary1").append('<button class="toggle dose">'+meds.medication[i].dose[j],+'</button> ');
            }
            $("#meddiary1").append('<input class="mednum" placeholder="how many?" type="number"><br class="endmed">');
        }
        $("#meddiary1").append('<button class="command" id="finishmed1">next</button>');
    
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
                printdebug("New pain diary added");
                updatepaindiary();
                
                changescreen("paindiarysummary");
                todaylogged=true;
            })
            .catch(function(error) {
                printdebug("Error adding pain diary: ", error);
            });
            
        });

        $("#submitsettings").click(function(){
            db.collection("users").doc(userid).update({
                NHI: encryptor.encrypt($("#nhi").val()),
                studyid: $("#researchid").val()
            });
            changescreen("home");
        });

        // TODO: Add option to have no notifications
        cordova.plugins.notification.local.cancellAll();
        cordova.plugins.notification.local.schedule({
            title: 'Update Pain Diary',
            text: 'You haven\'t logged your pain score today.',
            foreground: true,
            trigger: { every: 'minute' }
        });
        printdebug("ready");
    },
};

function applyotherinfotoggleclick() {
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

function makePainDiary4() {
    
    $("#paindiary4").html('<span class="question">other info</span>');
    for (i=0;i<otherinfooptions.length;i++) {
        $("#paindiary4").append('<button class="toggle">'+otherinfooptions[i]+'</button> ');
    }
    $("#paindiary4").append('<input id="newotherinfo" value="other" />');
    $("#paindiary4").append('<button id="oknewotherinfo">ok</button><hr>');
    $("#paindiary4").append('<button class="command" id="finish4">next</button>');

    applyotherinfotoggleclick();

    $('#oknewotherinfo').hide();
    $("#newotherinfo").click(function(){
        $(this).val('');
        $("#oknewotherinfo").show();
    });
    $("#oknewotherinfo").click(function(){
        $("#oknewotherinfo").hide();
        $('#newotherinfo').before('<button class="toggle">' + $('#newotherinfo').val().toLowerCase() + '</button>');
        applyotherinfotoggleclick();
        $('#paindiary4 .toggle').last().click();
        $('#newotherinfo').val('other');
    });
    
    $("#finish4").click(function(){
        changescreen("meddiary1");
    });
}
