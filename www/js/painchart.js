var listofdays = []; // list of all dates from today, length=numDays
var painscores = []; // list of painscores for listofdays
var painfactors = []; // list of pain factors for listofdays
var painmeds = []; // list of meds for listofdays

var marginwidth = 1; // in percent

// numdays - number of days to show
// showHours - not used, probably to be removed
function initPainChart(numDays,showHours) {
    // reset everything
    listofdays = [];
    painscores = [];
    painfactors = [];
    painmeds = [];

    printdebug("Intialising pain chart");
    if (!(numDays>0)) {
        printdebug("Invalid Number of days for Chart");
    } else {
        // generate the dates
        var thisday = todayString();
        var day = thisday.split('.')[2];
        var month = thisday.split('.')[1];
        var year = thisday.split('.')[0];
        for (i=0;i<numDays;i++) {
            if (month<10) { month = "0" + parseInt(month,10); }
            if (day<10) { day = "0" + parseInt(day,10); }
            thisday = year + "." + month + "." + day;

            listofdays.push(thisday);
            // check for pain data for this date
            var foundpaindata = false;
            for (j=0;j<paindiary.length;j++) {
                if (paindiary[j].date == thisday) {
                    painscores.push(paindiary[j].painscore);
                    painfactors.push(paindiary[j].otherfactors.toString());
                    var todaysmeds = "";
                    for (k=0;k<paindiary[j].medications.length;k++) {
                        todaysmeds = todaysmeds + " " + paindiary[j].medications[k].name;
                    }
                    painmeds.push(todaysmeds);
                    printdebug(thisday + ' found: ' + painscores[painscores.length-1] + painfactors[painfactors.length-1] + painmeds[painmeds.length-1]);
                    foundpaindata = true;
                    break;
                }
            }
            if (!foundpaindata) {
                painscores.push(-1);
                painfactors.push(-1);
                painmeds.push(-1);
            }
            // go back a day
            if (day>1) {
                day--;
            } else {
                if (month>1) {
                    month--;
                    if (month==1 || month==3 || month==5 || month==6 || month==8 || month==10) {
                        day = 31;
                    } else if (month==2) {
                        if (year%4==0) {
                            day = 29; // leap year
                        } else {
                            day = 28;
                        }
                    } else {
                        day = 30;
                    }
                } else {
                    day=31;
                    month=12;
                    year--;
                }
            }
            
        }
        dates = listofdays;

        /*
        #painbarchart
            #painchartbars
                (multiple) .painchartbar .painchartelement (.nodata)
            #painchartbartitles
                (multiple) .painchartbartitle    
            #factors
                (multiple) .factor
                    .factorname
                    .factordates
                        (multiple) .factorelement (.litup)
            #meds
                (multiple) .med
                    .factorname
                    .factordates
                        (multiple) .factorelement (.litup)
        */

        // generate the GUI
        if (numDays<1) {
            numDays = 1;
        }
        marginwidth=10/numDays; // was 20
        $("#painchart").empty();
        $("#painchart").append('<div id="painbarchart"></div>');
        var barwidth=Math.floor((100/numDays))-(2*marginwidth);
        $("#painbarchart").append('<div id="painchartbars"><div>');
        maxpain = Math.max(...painscores.slice(0,numDays));
        console.log(painscores.slice(0,numDays));
        for (i=0;i<numDays;i++) {
            $("#painchartbars").append('<span class="barchartbar barchartelement"></span>');
            if (painscores[i]==0) {
                $(".barchartbar:last").height("1px").hide().fadeIn();
            } else if (painscores[i]>0) {
                $(".barchartbar:last").height(((100*painscores[i]/maxpain)-(marginwidth*2))+"%").hide().fadeIn();
            } else { // no data
                $(".barchartbar:last").height("100%").addClass('nodata').hide().fadeIn();
            }
        }
        $("#painbarchart").append('<div id="painchartbartitles"></div>');
        for (i=0;i<numDays;i++) {
            $("#painchartbartitles").append('<span class="barchartbartitle barchartelement"></span>');
            // skip titles if lots of elements
            if (numDays<10) {
                // every element
                $(".barchartbartitle:last").append(formatdate(dates[i]));
            } else if (numDays<21) {
                // every third element
                if ((i%3)==0) {
                    $(".barchartbartitle:last").append(formatdate(dates[i]));
                }
            } else {
                // every 7th element
                if ((i%7)==0) {
                    $(".barchartbartitle:last").append(formatdate(dates[i]));
                }
            }
        }
        $(".barchartelement").width(barwidth+"%").css("margin",marginwidth+"%");
        
        
        // list the factors
        $("#painbarchart").append('<div id="factors"><div>');
        $("#factors").append("<button>hide factors</button>");
        $("#factors button").click(function() {
            $(".factor").toggle();
            if ($(".factor:last").is(":hidden")) {
                $("#factors button").html("show factors");
            } else {
                $("#factors button").html("hide factors");
            }
        });
        for (i=0;i<otherinfooptions.length;i++) {
            $('#factors').append('<div class="factor"><div>');
            $('.factor:last').append('<div class="factordates"></div>');
            
            for (j=0;j<numDays;j++) {
                $('.factordates:last').append('<span class="factorelement"></span>');
                try {
                    if (painfactors[j].includes(otherinfooptions[i])) {
                        $('.factorelement:last').addClass('litup');
                    }
                } catch(err) {
                    // painfactors[j] not defined
                } 
            }
            $('.factor:last').append('<div class="factorname">'+otherinfooptions[i]+'</div>');
            
        }
        $(".factorelement").width(barwidth+"%").css("margin",marginwidth+"%");
        

        // list the medications
        $("#painbarchart").append('<div id="meds"><div>');
        $("#meds").append("<button>hide medications</button>");
        $("#meds button").click(function() {
            $(".medd").toggle();
            if ($(".med:last").is(":hidden")) {
                $("#meds button").html("show medications");
            } else {
                $("#meds button").html("hide medications");
            }
        });
        for (i=0;i<meds.medication.length;i++) {
            printdebug("printing medication " + meds.medication[i].name);
            $('#meds').append('<div class="medd"><div class="meddates"></div></div>');
            for (j=0;j<numDays;j++) {
                $('.meddates:last').append('<span class="medelement"></span>');
                printdebug("comparing " + painmeds[j] + " with " + meds.medication[i].name);
                try {
                    if (painmeds[j].includes(meds.medication[i].name)) {
                        $('.medelement:last').addClass('litup');
                    }
                } catch(err) {
                    // painmeds[j] not defined or meds[i] undefined
                }
            }
            $('.medd:last').append('<div class="medname">' + meds.medication[i].name + '</div>');
        }
        
        $(".medelement").width(barwidth+"%").css("margin",marginwidth+"%");




        $("#painbarchart").append('<div id="painchartcontrols"></div>');
        $("#painchartcontrols").append("<button>week</button").children().last().click(function() {
            initPainChart(7,showHours);
        });
        $("#painchartcontrols").append("<button>month</button").children().last().click(function() {
            initPainChart(30,showHours);
        });
        $("#painchartcontrols").append("<button>3 months</button").children().last().click(function() {
            initPainChart(90,showHours);
        });
        $("#painchartcontrols").append("<button>+</button").children().last().click(function() {
            initPainChart(numDays+5,showHours);
        });
        $("#painchartcontrols").append("<button>-</button").children().last().click(function() {
            initPainChart(numDays-5,showHours);
        });
    }
}