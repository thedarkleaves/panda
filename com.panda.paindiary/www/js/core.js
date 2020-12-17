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
var medsused = [];
var notificationsOn = true;
var currenteditdate;
var storage = window.localStorage;
var calendar_iterator = 0;
var lastfewscreens = [];
var meds = [];
var defaultmeds = {
    "medication": [
        {
            "name":"paracetamol",
            "dose": ["500mg"]
        },
        {
            "name":"ibuprofen",
            "dose":["200mg"]
        },
        {
            "name":"codeine",
            "dose":["30mg","60mg"]
        },
        {
            "name":"tramadol",
            "dose":["50mg"]
        }
    ]
};

/**
 *  Return display format date from database format
 * @param dateString Date from the database
 * @returns Date formatted for display
 */
function formatdate(datestring) {
    splitdate=datestring.split('.');
    return(splitdate[2]+'/'+splitdate[1]+'/'+splitdate[0]);
}

/**
 * Return string for saving to the database
 * @param dateToFormat Date object to format
 */
function todayString(dateToFormat) {
    var today = new Date(); // if no argument passed use today
    var monthstring, datestring;
    if ((dateToFormat instanceof Date) && (dateToFormat.getTime()==dateToFormat.getTime())) {
        today = dateToFormat;
    } 
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

/**
 * Print a message to the debug area
 * @param {String} content Message to print
 */
function printdebug(content) {
    if (debug) {
        console.log(content);
        //$("#debug").append("<br>"+content);
    }
}

/**
 * Initialise the loading screen
 * @param {int} gridsize 
 */
function buildLoader(gridsize) {
    $("#pandaloading").height("100%").width("100%");
    for (i=0;i<gridsize;i++) {
        $("#pandaloading").append('<div class="pandaloader_row" id="pandaloader_row' + i + '"></div>');
        for (j=0;j<gridsize;j++) {
            $("#pandaloader_row" + i).append('<div id="pandaloader_row' + i + '_col' + j + '" class="pandaloader_box"></div>');    
        }      
    }
    var sizeofeach=(100/gridsize);
    $(".pandaloader_row").height(sizeofeach + "%");
    $(".pandaloader_box").height("100%").width(sizeofeach + "%").css("display","inline-block");
    setInterval(function(){
        var row = Math.floor(Math.random()*gridsize);
        var col = Math.floor(Math.random()*gridsize);
        var colour = "#" + (Math.floor(Math.random()*10) * 111111);
        $("#pandaloader_row" + row + "_col" + col).css("background-color",colour);
    },20);
}

/**
 * Show the loading screen (use hideLoading() to hide it)
 */
function showLoading() {
    var gridsize=10;
    $("#loadingscreen").show().empty();
    for (i=0;i<gridsize;i++) {
        $("#loadingscreen").append('<div class="pandaloader_row" id="pandaloader_row' + i + '"></div>');
        for (j=0;j<gridsize;j++) {
            $("#pandaloader_row" + i).append('<div id="pandaloader_row' + i + '_col' + j + '" class="pandaloader_box"></div>');    
        }      
    }
    var sizeofeach=(100/gridsize);
    $(".pandaloader_row").height(sizeofeach + "%");
    $(".pandaloader_box").height("100%").width(sizeofeach + "%").css("display","inline-block");
    $(".pandaloader_box").on("click",function() {
        var crosscolour = window.getComputedStyle(document.documentElement).getPropertyValue("--bits-colour1");
        $(this).css('background-color',crosscolour);
        var thisguy = $(this).attr('id');
        thisguy = thisguy.split("_row")[1];
        var row = thisguy.split("_col")[0];
        var col = thisguy.split("_col")[1];
        for (i=row;i>=0;i--) {
            $("#pandaloader_row" + i + "_col" + col).css("background-color",crosscolour);
        }
        for (i=row;i<gridsize;i++) {
            $("#pandaloader_row" + i + "_col" + col).css("background-color",crosscolour);    
        }
        for (i=col;i>=0;i--) {
            $("#pandaloader_row" + row + "_col" + i).css("background-color",crosscolour);
        }
        for (i=col;i<gridsize;i++) {
            $("#pandaloader_row" + row + "_col" + i).css("background-color",crosscolour);    
        }
        
    });
    setInterval(function(){
        var row = Math.floor(Math.random()*gridsize);
        var col = Math.floor(Math.random()*gridsize);
        var colour = "#" + (Math.floor(Math.random()*10) * 111111);
        $("#pandaloader_row" + row + "_col" + col).css("background-color",colour);
    },20);
}

/**
 * Hide the loading screen
 */
function hideLoading() {
    clearInterval();
    $("#loadingscreen").empty().hide();
}

function makeCalendarContent(dateToLookup) {
    var today = new Date();
    if (dateToLookup>today) {
        return "";
    } else {
        var dateSelected = todayString(dateToLookup);
        var dateforediting;
        var founddate = false;
        // use a global calendar_iterator so we don't start at the beginning each time
        
        for (x=0;x<paindiary.length;x++) {
            // use x instead of i
            // printdebug("calendar scanning " + paindiary[calendar_iterator].date);
            if (paindiary[calendar_iterator].date == dateSelected) {
                dateforediting = calendar_iterator;
                founddate = true;
                break;
            } else {
                calendar_iterator++;
                if (calendar_iterator>=paindiary.length) {
                    calendar_iterator = 0;
                }
            }
        }
        try {
            if (founddate) {
                var thisCircle = '<div class="circle">' + paindiary[dateforediting].painscore + '</div>';
                return thisCircle;
            } else {
                var thisBlankDate = '<div class="blankdate">?</div>';
                return thisBlankDate;
            } 
        } catch(err) {
            printdebug("calendar fail: " + err.message);
        }

    }
}


function clickCalendarContent(dateClicked) {
    var today = new Date();
    if (dateClicked>today) {
        // clicked a date in the future
        printdebug("Clicked a date in the future...");
    } else {
        var dateSelected = todayString(dateClicked);
        printdebug("Editing: " + dateSelected);
        // find the date
        var founddate = false;
        for (x=0;x<paindiary.length;x++) {
            // use x instead of i
            if (paindiary[x].date == dateSelected) {
                dateforediting = x;
                founddate = true;
                break;
            }
        }
        if (founddate) {
            // highlight the clicked date
            updateCalendar(dateClicked);            
        } else {
            // clicked a date with no data
            enterNewPainDiary(dateSelected);                
        }
    }
  
}

/**
 * Request a re-read of the pain diary from the database
 * Subsequently calls other functions to update everything in the app
 */
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
            thispainday.journal=painday.data().journal;
            paindiary.push(thispainday);
            printdebug('received paindata ' + thispainday.date);
        });
        try {
            printpaindiary();
            printdebug("Trying to create pain chart.");
            initPainChart(7,0);
            makePainDiary4();
            hideLoading();
        } catch(err) {
            popupmessage(err.message);
        }
    });

}

/**
 * Update the medications
 */
function updatemeds() {
    // load the medications from the database
    printdebug("Loading medications from database");
    meds = [];
    db.collection("users").doc(userid).collection("meds").get().then(function(dbmedlist) {
        printdebug("Medications loaded successfully");
        $("#wantedmeds").empty();
        dbmedlist.forEach(function(dbmed) {
            var thismed = new Array(3);
            thismed[0] = dbmed.id; // medication name
            thismed[1] = []; // medication doses array
            thismed[2] = true; // medication wanted (i.e. user wants to see it as an option)
            var medindex = (meds.push(thismed)-1);
            updatemeddoses(medindex);
        });
    
        // now add any other medications from the diary that aren't "wanted"
        printdebug("Searching Pain Diary for additional medications...");
        $("#unwantedmeds").empty().append("<hr>Other medications that you've used in the past:<br>");
        for (var i=0;i<paindiary.length;i++) {
            if ((paindiary[i].medications!=undefined) && (paindiary[i].medications.length>0)) {
                for (var j=0;j<paindiary[i].medications.length;j++) {
                    if ((paindiary[i].medications[j].dose != undefined)) {
                        addmed(paindiary[i].medications[j].name,paindiary[i].medications[j].dose);
                    } else {
                        addmed(paindiary[i].medications[j].name);
                    }
                }
            }
        }
        initPainChart(7,0);
    });

}

function updatemeddoses(medindex) {
    printdebug("Loading doses for " + meds[medindex][0]);
    db.collection("users").doc(userid).collection("meds").doc(meds[medindex][0]).collection("dose").get().then(function(dbdoselist) {
        thismeddoses = [];
        dbdoselist.forEach(function(dbmeddose) {
            thismeddoses.push(dbmeddose.id);
        });
        meds[medindex][1] = thismeddoses;
        $("#wantedmeds").append('<div class="managesinglemed">' + meds[medindex][0] + 
            '<button class="managedoses">doses</button><button class="killmed" id="'+ meds[medindex][0] + '">remove</button></div>');
        $(".managedoses:last").click(function() {
            $(this).unbind('click').click(function() {
                $(this).parent().children('.dosemanager').toggle();
            });
            $(this).parent().append('<div class="dosemanager"></div>');
            for (var i=0;i<meds[medindex][1].length;i++) {
                $(this).parent().children('.dosemanager').append('<div>' + meds[medindex][1][i] + 
                    '<button class="killdose" id="' + meds[medindex][0] + '_._' + meds[medindex][1][i] + '">remove</button></div>');
                $('.killdose:last').click(function() {
                    var gonerdose = $(this).attr('id').split("_._");
                    db.collection("users").doc(userid).collection("meds").doc(gonerdose[0]).collection("dose").doc(gonerdose[1]).delete().then(function() {
                        printdebug("dose removed");
                    });
                    $(this).parent().remove();
                });
            }
            $(this).parent().children('.dosemanager').append('<div><input type="text" class="newdoseinput" size=5></input><button class="adddose">add dose</button><hr class="secondaryhr"></div>');
            $('.adddose:last').click(function() {
                var newdose = cleanString($(this).parent().children('.newdoseinput').val());
                if (newdose=="") {
                    popupmessage("Please enter a dose.");
                } else {
                    db.collection("users").doc(userid).collection("meds").doc(meds[medindex][0]).collection("dose").doc(newdose).set({
                        id: newdose
                    }).then(function() {
                        $('.newdoseinput').val('');
                        printdebug('dose added');
                        updatemeds();
                    });
                }
            });
        });
        $(".killmed:last").click(function() {
            var gonermed = $(this).attr('id');
            checkUserReallyWantsToContinue('Are you sure you want to remove ' + gonermed + '?',function() {
                db.collection("users").doc(userid).collection("meds").doc(gonermed).delete().then(function() {
                    printdebug("medication removed");
                    updatemeds();
                });
            });
        });
        printdebug("loaded db med: " + meds[medindex]);
    });
}

/**
 * add a medication from the diary that's not "wanted" (i.e. listed in the DB meds list that the user wants to see)
 * (automatically sorts out duplicates, and only adds a new dose if needed)
 */
function addmed(medName,dose) {
    // check if the medication is already listed
    var alreadylisted = false;
    for (var i=0;i<meds.length;i++) {
        if (meds[i][0] == medName) {
            // the med is already in the list
            alreadylisted = true;
            // check if the current dose is in the list, add it if not
            if (!(dose===undefined)) {
                var dosealreadylisted = false;
                for (var j=0;j<meds[i][1].length;j++) {
                    if (meds[i][1][j]==dose) {
                        dosealreadylisted = true;
                        break;
                    }
                }
                if (!dosealreadylisted) {
                    meds[i][1].push(dose);
                }
            }
            break;
        } 
    }
    // if the medication is not in the list, add it
    if (!alreadylisted) {
        printdebug("adding 'unwanted' med " + medName);
        var thismed = new Array(3);
        thismed[0] = medName; // medication name
        thismed[1] = []; // medication doses array
        if (!(dose===undefined)) {
            thismed[1].push(dose);
        }
        thismed[2] = false; // medication wanted (i.e. user wants to see it as an option)
        meds.push(thismed);
        $("#unwantedmeds").append(medName + '<button id="addbackmed_' + medName + '">add to list</button><br>');
        $("#unwantedmeds button:last").click(function(){ 
            var addbackmed = $(this).attr('id').split("addbackmed_")[1];
            addDBMed(addbackmed);
        });
    }
}

/**
 * Add a medication to the database
 * @param {String} medName Name of the medication
 */
function addDBMed(medName) {
    printdebug("Adding " + medName + " to database");
    $("#newDBmed").val("");
    db.collection("users").doc(userid).collection("meds").doc(medName).set({
        "id": medName
    }).then(function(docref) {
        updatemeds();
    }).catch(function(error){
        printdebug('error adding medication ' + medName + " to DB: " + error);
    });
}

/**
 * Add a new provider to the database
 * @param {String} providerid The ID of the provider in the database
 */
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

/**
 * Update providers for this user
 */
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
            var providercode = $("#addprovidercode").val();
            checkUserReallyWantsToContinue(checkmessage,function(){
                addprovider(providercode);
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

/**
 * Remove a provider for the current user
 * @param {String} providerid The Provider ID in the database
 */
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
            var studycode = $("#addstudycode").val();
            var message="This will allow some of your personal information and pain diary to be available to the selected study.";
            checkUserReallyWantsToContinue(message,function() {
                addstudy(studycode);
            });
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
        $('#studies').append('Study Removed. <button>undo</button><br>');
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

/**
 * Change screens
 * @param {String} screenname The ID of the screen name to change to
 */
function changescreen(screenname) {
    $(".screen").fadeOut(screenspeed/2);
    window.scrollTo(0,0);
    $("#" + screenname).show(screenspeed);
    if (screenname=="home") {
        if (todaylogged) {
            $("#logtoday").hide();
        } else {
            $("#logtoday").show();
        }
    }
    if (screenname=="paindiary3") {
        $("#painhoursquestion").append("for how many hours was your pain more 'than " + painscore + " out of 10?");
    }
    if (screenname!="controls") {
        lastfewscreens.push(screenname);
        printdebug("Last Few Screns: " + lastfewscreens);
    }
    
}

/**
 *  Print the pain diary
 */
function printpaindiary() {
    // reset the inputs
    var pagelength = 7;
    var curdiarypage = 0;
    
    $("#paindiarysummary").empty().append("<button>add missing day</button><hr>");
    $("#paindiarysummary button:last").click(function() {
        changescreen("calendar_screen");
    });
    $("#paindiarysummary").append("<button>prev week</button>");
    $("#paindiarysummary button:last").click(function() {
        if (curdiarypage<(Math.floor(paindiary.length/pagelength))) {
            $(".paindiarysummarypage").hide();
            $("#paindiarysummary_page" + ++curdiarypage).show();
        }
    });

    $("#paindiarysummary").append("<button>next week</button><hr>");
    $("#paindiarysummary button:last").click(function() {
        if (curdiarypage>0) {
            $(".paindiarysummarypage").hide();
            $("#paindiarysummary_page" + --curdiarypage).show();
        }
    });    
    
    /*
    for (i=paindiary.length-1;i>=0;i--) {
        printOnePainDay(i,"#paindiarysummary");
    }
    */
    
    for (var j=0;j<(Math.ceil(paindiary.length/pagelength));j++) {
        $("#paindiarysummary").append('<div id="paindiarysummary_page'+j+'" class="paindiarysummarypage"></div>');
        for (var i=1;i<=pagelength;i++) {
            var nextdiaryindex = (paindiary.length-i-(j*pagelength));
            if (nextdiaryindex>=0) {
                printOnePainDay(nextdiaryindex,"#paindiarysummary_page"+j);    
            }
        }
    }
    $(".paindiarysummarypage").hide();
    $("#paindiarysummary_page0").show();

    // Update the calendar
    var today = new Date();
    updateCalendar(today);

}

/**
 * Print a single day's data
 * @param {} paindiaryindex The index of the painrdiary array 
 * @param {} elementToPrintTo The element to print to (string including hash if id)
 */
function printOnePainDay(paindiaryindex,elementToPrintTo) {
    $(elementToPrintTo).append('<div class="paindiaryday" id="paindiary_' + cleanString(paindiary[paindiaryindex].date) + '"></div>');
    // print the date
    $(elementToPrintTo + " .paindiaryday:last").append('<span class="datehead">'+formatdate(paindiary[paindiaryindex].date)+'</span>');
    $(elementToPrintTo + " .paindiaryday:last").append('<span class="date_for_db" style="display:none">'+paindiary[paindiaryindex].date+'</span');
    // print the pain score
    $(elementToPrintTo + " .paindiaryday:last").append('<span class="painscorehead"><span class="diarybit">pain score:</span> <span class="painscore_for_db">' + paindiary[paindiaryindex].painscore + '</span></span><br>');
    //$("#paindiarysummary").last().append("pain hours: " + paindiary[i].painhours+"<br>");
    
    $(elementToPrintTo + " .paindiaryday:last").append('<span class="paindiaryfactors"></span><span class="paindiarymeds"></span><br>');
    
    // print the other factors
    if ((paindiary[paindiaryindex].otherfactors!=undefined) && (paindiary[paindiaryindex].otherfactors.length>0)) {
        $(elementToPrintTo + " .paindiaryfactors:last").append('<span class="diarybit">factors:</span><br> <div class="paindiaryfactorlist"></div>');
        for (j=0;j<paindiary[paindiaryindex].otherfactors.length;j++) {
            $(elementToPrintTo + " .paindiaryfactorlist:last").append(paindiary[paindiaryindex].otherfactors[j] + '<br>');
        }
    }
    // print the medications
    if ((paindiary[paindiaryindex].medications!=undefined) && (paindiary[paindiaryindex].medications.length>0)) {
        $(elementToPrintTo + " .paindiarymeds:last").append('<span class="diarybit">medications:</span><br>');
        for (j=0;j<paindiary[paindiaryindex].medications.length;j++) {
            if ((paindiary[paindiaryindex].medications[j].dose != undefined) && (paindiary[paindiaryindex].medications[j].mednum != undefined)) {
                $(elementToPrintTo + " .paindiarymeds:last").append(paindiary[paindiaryindex].medications[j].name + " <sub>" + paindiary[paindiaryindex].medications[j].dose + " x " + paindiary[paindiaryindex].medications[j].mednum + "</sub><br>");
            } else {
                $(elementToPrintTo + " .paindiarymeds:last").append(paindiary[paindiaryindex].medications[j].name + "<br>");    
            }
        }
    }
    // print the journal entry
    if ((paindiary[paindiaryindex].journal!=undefined) && (paindiary[paindiaryindex].journal != "")) {
        $(elementToPrintTo + " .paindiaryday:last").append('<br><span class="diarybit">journal:</span><br>');
        $(elementToPrintTo + " .paindiaryday:last").append('<div class="journalentry">' + paindiary[paindiaryindex].journal + '</div>');
    }
    $(elementToPrintTo + " .paindiaryday:last").append('<button class="littlebutton">edit</button><hr>');
    $(elementToPrintTo + " .paindiaryday button:last").click(function(){
        // modify the current pain diary entry
        try {
            enterNewPainDiary($(this).parent().find(".date_for_db:last").html());
        } catch(err) {
            popupmessage(err.message);
        }
    });
}

/**
 * Update Calendar
 * 
 * Print the calendar with controls
 */
function updateCalendar(calendarDate) {
    $("#calendar").empty();
    printCalendar("#calendar","month",calendarDate,makeCalendarContent,clickCalendarContent);
    $(".circle").each(function() {
        var circleSize = $(this).html() * 10;
        $(this).html("&nbsp;");
        $(this).css("height",circleSize + "%").css("width",circleSize + "%");
    });

    $("#calendar").prepend('<div id="calendarControls"></div>');
    $("#calendarControls").append('<button id="calendar_backmonth">prev</button> | ');
    $("#calendarControls").append('<span id="calendar_labelmonth">' + calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' }) + '</span>');
    $("#calendarControls").append(' | <button id="calendar_forwardmonth">next</button>');
    // make the buttons work 
    $("#calendar_backmonth").click(function() {
        calendarDate.setMonth(calendarDate.getMonth()-1);
        updateCalendar(calendarDate);
    });
    // hide the next button if we're at the current month
    var today = new Date();
    if (today.getFullYear() == calendarDate.getFullYear() && today.getMonth() == calendarDate.getMonth()) {
        $("#calendar_forwardmonth").hide();
    } else {
        $("#calendar_forwardmonth").show();
        $("#calendar_forwardmonth").click(function() {
            calendarDate.setMonth(calendarDate.getMonth()+1);
            updateCalendar(calendarDate);
        });
    }
    $("#calendar").append('<hr><div id="under_calendar"></div>');
    // print the clicked date's info
    var dataexistsforthisdate = false;
    var indexforthisdate;
    for (i=0;i<paindiary.length;i++) {
        var searchDate = todayString(calendarDate);
        if (paindiary[i].date == searchDate) {
            dataexistsforthisdate = true;
            indexforthisdate = i;
            break;
        }
    }
    if (dataexistsforthisdate) {
        printOnePainDay(indexforthisdate,"#under_calendar");
    }
}

function checkUserReallyWantsToContinue(message,functioniftrue) {
    $("#confirmbox").show();
    $(".confirmboxfront").html(message + "<br>");
    $(".confirmboxfront").append("<button>go ahead</button>");
    $(".confirmboxfront button:last-child").click(function() {
        $(".confirmboxfront").html("");
        $("#confirmbox").hide();
        functioniftrue();
    });
    $(".confirmboxfront").append("<button>don't do it</button>");
    $(".confirmboxfront button:last-child").click(function() {
        $(".confirmboxfront").empty();
        $("#confirmbox").hide();
    });
}

/**
 * Pop up a message on the screen (with a "Got it" button)
 * @param  message Message to be given the user
 */
function popupmessage(message) {
    $("#confirmbox").show();
    $(".confirmboxfront").html(message + "<br>");
    $(".confirmboxfront").append("<button>got it</button>");
    $(".confirmboxfront button:last-child").click(function() {
        $(".confirmboxfront").empty();
        $("#confirmbox").hide();
    });
}

function pressedBack() {
    if (lastfewscreens.length<=1) {
        popupmessage("nothing to go back to.");
    } else {
        // remove the current screen from the list, then get the last screen remaining
        lastfewscreens.pop();
        printdebug("Last Few Screens: " + lastfewscreens);
        var backScreen = lastfewscreens.pop();
        printdebug("trying to go back to " + backScreen);
        if (backScreen=="journal") {
            popupmessage("can't go back to the journal page."); // TODO: fix this
        } else {
            changescreen(backScreen);
        }
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
        document.addEventListener("backbutton",pressedBack,false);

        printdebug("initialising firebase");
        // firebase config
        var firebaseConfig = {
            apiKey: "AIzaSyBpswv3urspqLGm0HVJV7dkQwrhUoMuyWM",
            authDomain: "panda-paindiary.firebaseapp.com",
            databaseURL: "https://panda-paindiary.firebaseio.com",
            projectId: "panda-paindiary",
            storageBucket: "panda-paindiary.appspot.com",
            messagingSenderId: "508945478811",
            appId: "1:508945478811:web:9524176af30bcf8d8c823e",
            measurementId: "G-TKCG6YY89R"
        };
        // initialize firebase
        firebase.initializeApp(firebaseConfig);    

        // catch attempted log in
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // logged in successfully
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
                    // var currentuser = currentuserref.get();
                    printdebug("attempted to get current user from database");
                        if (currentuser.exists) {
                            userid=user.uid;
                            username=encryptor.decrypt(currentuser.data().name);
                            printdebug("logged in as :" + username);
                            var NHIencrypted = currentuser.data().NHI;
                            var NHIdecrypted;
                            if (NHIencrypted === null) {
                                NHIdecrypted = "";
                            } else {
                                NHIdecrypted = encryptor.decrypt(NHIencrypted);
                            }
                            $("#nhi").val(NHIdecrypted);
                            
                            printdebug("NHI loaded");
                            updatepaindiary();
                            updateproviders();
                            updatestudies();
                            updatemeds();
                        } else {
                            // add the user to the database
                            printdebug("new user: "+ user.uid);
                            var encryptedname = encryptor.encrypt(user.displayName);
                            db.collection("users").doc(user.uid).set({
                                name: encryptedname,
                                uid: user.uid,
                                NHI:null,
                            })
                            .then(function(docRef) {
                                printdebug("New user added: ", user.displayName);
                            })
                            .catch(function(error) {
                                printdebug("Error adding new user: ", error);
                            });
                            userid=user.uid;
                            
                            // add default meds
                            for (i=0;i<defaultmeds.medication.length;i++) {
                                db.collection("users").doc(user.uid).collection("meds").doc(defaultmeds.medication[i].name).set({    
                                    name: defaultmeds.medication[i].name,
                                });
                                
                                for (j=0;j<defaultmeds.medication[i].dose.length;j++) {
                                    printdebug("adding dose for " + defaultmeds.medication[i].name);
                                    db.collection("users").doc(user.uid).collection("meds").doc(defaultmeds.medication[i].name).collection("dose").doc(defaultmeds.medication[i].dose[j]).set({
                                        id: defaultmeds.medication[i].dose[j]
                                    });    
                                }
                            }

                            // successfully created user, load the pain diary
                            updatepaindiary();
                            updatemeds();
                            
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
                hideLoading();
            }
        });

        // initialise
        $(".screen").hide();
        
        // set up buttons
        // #home
        $("#logtoday").click(function(){
            enterNewPainDiary(todayString());
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
        $("#calendar_button").click(function(){
            changescreen("calendar_screen");
        });
        $("#paindiary_button").click(function(){
            printpaindiary();
            changescreen("paindiarysummary");
        });
        $("#home_button").click(function(){
            changescreen("home");
        });
        $("#insights_button").click(function() {
            changescreen("insights");
            printInsights("#insights");
        });
        $("#managemeds_button").click(function() {
            changescreen("managemeds");
        });
        $("#settings_button").click(function(){
            changescreen("settings");
        });
        
        // #paindiary1
        $("#todaypainyes").click(function(){
            changescreen("paindiary2");
        });

        // #diary_calendar
        $("#diary_calendar input").change(function() {
            var caughtdate = new Date($("#diary_calendar input").val());
            var futurechecker = new Date();
            var validdate = true;
            printdebug("checking date: " + caughtdate);
            // check that a date was selected
            if (caughtdate.getTime()!=caughtdate.getTime()) {
                printdebug("Invalid date selected.");
                validdate = false;
            }
            // check the date is not in the future
            if (caughtdate.getTime() > futurechecker.getTime()) {
                popupmessage("Sorry! You can't add pain a diary in the future!");
                validdate = false;
            }
            // check the date is not more than 3 months ago
            futurechecker.setMonth(futurechecker.getMonth() - 3); // technically it's a pastchecker now
            if (caughtdate.getTime() < futurechecker.getTime()) {
                popupmessage("Sorry! You can't add a pain diary more than 3 months old.");
                validdate = false;
            }
            printdebug("date validity: " + validdate.toString());
            if (validdate) {
                // check if the date already has data
                var dateSelected = todayString(caughtdate);
                // warn if this date already has data
                for (i=0;i<paindiary.length;i++) {
                    if (paindiary[i].date==dateSelected) {
                        popupmessage("This date already has data, but you can go ahead and change it if you like.");
                        break;
                    }
                }
                printdebug("Editing: " + dateSelected);
                enterNewPainDiary(dateSelected);
            }
        });


        $("#todaypainno").click(function(){
            // Log no pain today
            db.collection("users").doc(userid).collection("diary").doc(currenteditdate).set({
                "painscore": 0,
            })
            .then(function(docRef) {
                console.log("New pain diary added");
            })
            .catch(function(error) {
                console.error("Error adding pain diary: ", error);
            });
            if (currenteditdate==todayString()) {
                todaylogged=true;
            }
            updatepaindiary();
            changescreen("home");
        });

        // #paindiary2 (only needs to be done once at intiial load)
        for (i=0;i<=10;i++) {
            $("#paindiary2").append('<button class="1to10" id="painscore'+i+'">'+i+'</button>');
            $("#painscore"+i).click(function(){
                painscore=$(this).attr("id").split("painscore")[1];
            });
        }
        $(".1to10").click(function(){
            changescreen("paindiary4");
            $("#paindiary2 button").removeClass("toggleTrue");
        });

        /* #paindiary3 (removed)
        for (i=1;i<=24;i++) {
            $("#paindiary3").append('<button class="1to24" id="painhours'+i+'">'+i+'</button>');
            $("#painhours"+i).click(function(){
                painhours=$(this).attr("id").split("painhours")[1];
            });
        }
        $(".1to24").click(function(){
            changescreen("paindiary4");
        });
        */

        // #paindiary4 deferred until paindiary loaded, needs to be reloaded every entry
        // #meddiary1 as above 
        
        // #journal
        $("#journal").append('<span class="question">comments / journal</span>');
        $("#journal").append('<textarea id="journaltext" rows="10"></textarea>');
        $("#journal").append('<button>save to diary</button>');
        $("#journal button").click(function() {
            submitPainDiary();
        });

        $("#submitnhi").click(function(){
            var message="Any healthcare providors and research studies you have given permission to will see this information.";
            checkUserReallyWantsToContinue(message,function(){
                printdebug("Saving NHI");                
                db.collection("users").doc(userid).update({
                    NHI: encryptor.encrypt($("#nhi").val()),
                });
                changescreen("home");
            });
        });

        // #managemeds
        $("#managemeds").append('<span class="question">medications</span>');
        $("#managemeds").append('<div class="answer"><div id="wantedmeds"></div><div id="unwantedmeds"></div></div>');
        $("#unwantedmeds").before('<input type="text" id="newDBmed" size="30"><button id="addNewDBmed">add medication</button>');
        $("#addNewDBmed").click(function() {
            addDBMed($("#newDBmed").val());
        });
        
                
        // Nofitication Buttons
        $("#notificationsOnButton").click(function() {
            storage.setItem("notificationsOn","true");
            $("#notificationsOnButton").addClass("toggletrue");
            $("#notificationsOffButton").removeClass("toggletrue");
            resetNotifications();
        });
        $("#notificationsOffButton").click(function() {
            storage.setItem("notificationsOn","false");
            $("#notificationsOnButton").removeClass("toggletrue");
            $("#notificationsOffButton").addClass("toggletrue");
            resetNotifications();
        });
        resetNotifications();

        // set up the help buttons
        $("#helpbutton_notifications").click(function() {
            popupmessage("Turn on or off a daily reminder to add your pain diary entry.");
        });
        $("#helpbutton_nhi").click(function() {
            popupmessage("Supply your health system identification number for healthcare" +
            "providors and studies to be able to identify you and link your health system." +
            "This information is stored in an encrypted database and is not accessible to " +
            "anyone outside of those you choose to give access to below.");
        });
        $("#helpbutton_research").click(function(){
            popupmessage("Enrol in a research study. This will allow the information you " +
            "have entered above, as well as your pain diary information to be visible to " +
            "the research study. To enrol in a research study you will need to know the unique " +
            "code for that study (provided by the researchers).");
        });
        $("#helpbutton_providers").click(function(){
            popupmessage("Allow a healthcare providor to have access to your pain diary. " +
            "The providor will have access to the information you provide above and your pain diary." +
            "You will need to know the healthcare providor's unique code to be able to add them. " +
            "You can remove access to any providor at any time.");
        });



        printdebug("ready");
    },
};

function resetNotifications() {
    cordova.plugins.notification.local.clearAll();
    printdebug("notifications: " + storage.getItem("notificationsOn"));
    if (storage.getItem("notificationsOn")=="false") {
        notificationsOn=false;
    } else {
        notificationsOn=true;
    }
    if (notificationsOn) {
        $("#notificationsOnButton").addClass("toggletrue");
        cordova.plugins.notification.local.schedule({
            title: 'Update Pain Diary',
            text: 'You haven\'t logged your pain score today.',
            icon: 'img/panda_bw.png',
            trigger: { every: 'day' }
        });
        if (!todaylogged) {
            cordova.plugins.notification.local.schedule({
                title: 'Update Pain Diary',
                text: 'You still haven\'t logged your pain score today.',
                icon: 'img/panda_bw.png',
                trigger:  { in: 3, unit: 'hour' }
            });
        }
    } else {
        // no notifications wanted
        $("#notificationsOffButton").addClass("toggletrue");
    }
}

function applyotherinfotoggleclick() {
    $("#paindiary4 .toggle").off("click");
    $("#paindiary4 .toggle").click(function(){
        $(this).toggleClass('toggletrue');
        if ($(this).hasClass('toggletrue')) {
            otherinfo.push($(this).text());
        } else {
            otherinfo.splice(otherinfo.indexOf($(this).text()),1);
        }
        printdebug('other factors: ' + otherinfo);
    });
}

/**
 * Start a new pain diary entry
 * 
 * @param {*} datesString the date to be entered
 */
function enterNewPainDiary(dateString) {
    
    currenteditdate = dateString;
    otherinfo = [];

    // check if this date already has data 
    var alreadyentered = false;
    var dateforediting;
    for (i=0;i<paindiary.length;i++) {
        if (paindiary[i].date == currenteditdate) {
            alreadyentered = true;
            dateforediting = i;
            break;
        }
    }

    // remake some bits
    printdebug('recreating the input pages');
    $('.1to10').removeClass("toggletrue");
    makePainDiary4();
    makeMedDiary();
    $("#journalentry").empty();
    printdebug('recreated the input pages');
    
    // preload data into the pain diary entry screens
    if (alreadyentered) {
        printdebug("preloading data");
        // highlight the painscore on paindiary2
        painscore = paindiary[dateforediting].painscore;
        $("#painscore" + painscore).toggleClass("toggletrue");
        // pre click the factors (fire click on #paindiary4 button that matches)
        if (paindiary[dateforediting].otherfactors != undefined) {
            for (i=0;i<paindiary[dateforediting].otherfactors.length;i++) {
                var thisfactor = paindiary[dateforediting].otherfactors[i];
                printdebug("pre-clicking button " + thisfactor);
                $("#factorbutton_" + cleanString(thisfactor)).trigger("click");
            }    
        }
        // preclick the medications
        if (paindiary[dateforediting].medications != undefined) {
            for (i=0; i<paindiary[dateforediting].medications.length;i++) {
                var thismedname = paindiary[dateforediting].medications[i].name;
                $("#medbutton_" + cleanString(thismedname)).trigger("click");
                try {
                    var thismeddose = paindiary[dateforediting].medications[i].dose;
                    var thismednum = paindiary[dateforediting].medications[i].mednum;
                    $("#medbutton_" + cleanString(thismedname) + "_" + cleanString(thismeddose)).trigger("click");
                    $("#mednumber_" + cleanString(thismedname)).val(thismednum);
                } catch(err) {
                    printdebug("no dose / number details");
                }
            }
        }
            // jump to screen 2
        changescreen("paindiary2");
    } else {
        // reset pain entry screens to blank
        // load screen 1
        $("#paindiary1 .question").empty().append(formatdate(dateString) + "<br>did you have any pain on this day?");
        changescreen("paindiary1");
    }
    
}

/**
 * Remove all non alphanumeric characters from a string
 * @param {} dirtyString The string with whatever bits in it
 * @returns A string with only alphanumeric characters
 */
function cleanString(dirtyString) {
    try {
        return dirtyString.toString().toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");
    } catch {
        return "";
    }
}
 

function makePainDiary4() {
    
    $("#paindiary4").html('<span class="question">other info</span>');
    for (i=0;i<otherinfooptions.length;i++) {
        $("#paindiary4").append('<button class="toggle" id="factorbutton_' + cleanString(otherinfooptions[i]) + '">'+otherinfooptions[i]+'</button> ');
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
        $("paindiary4 button").removeClass("toggleTrue");
        changescreen("meddiary1");
    });
}

/**
 * Activate the medication buttons
 */
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

/**
 * Create the medication diary page
 */
function makeMedDiary() {
    // med diary 1
    $("#meddiary1").html('<span class="question">which medications did you use?</span><br>');
    for (i=0;i<meds.length;i++) {
        // only include "wanted" medications
        if (meds[i][2]) {
            // create each medication
            $("#meddiary1").append('<button class="toggle med" id="medbutton_' + cleanString(meds[i][0]) + '">' + meds[i][0] + '</button>');
            for (j=0;j<meds[i][1].length;j++) {
                // create each dose button
                $("#meddiary1").append('<button class="toggle dose" id="medbutton_' + cleanString(meds[i][0]) + '_' + cleanString(meds[i][1][j]) + '">' + meds[i][1][j] + '</button> ');
            }
            $("#meddiary1").append('<input class="mednum" id="mednumber_' + cleanString(meds[i][0]) + '" placeholder="how many?" type="number"><br class="endmed">');
        }
    }
    $("#meddiary1").append('<br><button class="command" id="changemeds">manage medications</button>');
    $("#changemeds").click(function() {
        
        changescreen("managemeds");
    });
    $("#meddiary1").append('<hr><button class="command" id="finishmed1">next</button>');

    $(".toggle.dose").hide();
    $(".mednum").hide();

    applymedtoggleclick();

    $("#finishmed1").click(function(){
        // collect all logged meds
        medsused = [];
        $('.med.toggletrue').each(function() {
            
            var thismed = {};
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

        changescreen("journal");
        
    });
}



function submitPainDiary() {
    // clear the back history so the user can't go back to the editing pages
    lastfewscreens = [];
    //showLoading();
    var journal = $.trim($("#journaltext").val());
    db.collection("users").doc(userid).collection("diary").doc(currenteditdate).set({
        "painscore": painscore,
        //"painhours": painhours,
        "otherfactors": otherinfo,
        "medications": medsused,
        "journal": journal
    })
    .then(function(docRef) {
        printdebug("New pain diary added");
        updatepaindiary();
        changescreen("paindiarysummary");
        if (currenteditdate==todayString()) {
            todaylogged=true;
        }
        resetNotifications();
    })
    .catch(function(error) {
        printdebug("Error adding pain diary: ", error);
    });

}

showLoading();