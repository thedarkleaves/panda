var listofdays = []; // list of all dates from today, length=numDays
var painscores = []; // list of painscores for listofdays
var painfactors = []; // list of pain factors for listofdays
var painmeds = []; // list of meds for listofdays
var pagewidth = window.innerWidth;

var marginwidth = 1; // in percent

// numdays - number of days to show
// showHours - not used, probably to be removed
function initPainChart(numDays,showHours) {
    // TODO: Fix the abnormal spacing when the width exceeds 100% (note if the little numbers aren't position: fixed it works)...
    // Potentially need to try and make the numbers the same as the factor labels, and insert a placeholder instead?
    var pausetime = 500;
    if (numDays>0 && numDays<100) {
        pausetime = numDays * 5;
    }
    // show loading screen
    $("#painchart").empty().append('generating pain chart<br><div id="painchartloader">reading pain diary...</div>');    
    $("#painchartloader").fadeOut(pausetime,function () {
            
        // reset everything
        listofdays = [];
        painscores = [];
        painfactors = [];
        painmeds = [];

        printdebug("Intialising pain chart");
        
        printdebug("Creating Pain Chart");
        // generate the dates
        var thisday = todayString();
        var day = thisday.split('.')[2];
        var month = thisday.split('.')[1];
        var year = thisday.split('.')[0];
        
        var graphdays = 0;
        var graphpaindays = 1;

        while (graphpaindays<paindiary.length || graphdays<numDays) {
            //printdebug("graph day : " + graphdays + "(found " + graphpaindays + " of " + paindiary.length + ")");
            if (month<10) { month = "0" + parseInt(month,10); }
            if (day<10) { day = "0" + parseInt(day,10); }
            thisday = year + "." + month + "." + day;

            listofdays.push(thisday);
            graphdays++;
            // check for pain data for this date
            var foundpaindata = false;
            for (j=0;j<paindiary.length;j++) {
                if (paindiary[j].date == thisday) {
                    painscores.push(paindiary[j].painscore);
                    try {
                        painfactors.push(paindiary[j].otherfactors.toString());
                    } catch(err) {
                        // no pain factors found
                        painfactors.push("");
                    }
                    var todaysmeds = "";
                    try {
                        for (k=0;k<paindiary[j].medications.length;k++) {
                            todaysmeds = todaysmeds + " " + paindiary[j].medications[k].name;
                        }
                    } catch(err) {
                        // no meds found
                    }
                    painmeds.push(todaysmeds);
                    //printdebug(thisday + ' found: ' + painscores[painscores.length-1] + painfactors[painfactors.length-1] + painmeds[painmeds.length-1]);
                    foundpaindata = true;
                    graphpaindays++;
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
            // print the progress
            var progress;
            if (numDays>0) {
                progress = Math.floor(graphdays / numDays);
            } else {
                progress = Math.floor(graphpaindays / paindiary.length);
            }
            
            // break if we only want a certain number of days
            if (numDays>0 && (graphdays >= numDays)) break;
            // break if we're in an endless loop (i.e. greater than 10 years)
            if (graphdays > 365*10) break;
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


        // pause, then generate the GUI
        $("#painchartloader").show().empty().append("plotting data...").fadeOut(pausetime,function () {
            marginwidth = (pagewidth/graphdays)*0.05;
            if (marginwidth<2) marginwidth=2;
            $("#painchart").empty();
            $("#painchart").append('<div id="painbarchart"></div>');
            var barwidth = Math.floor((pagewidth/(graphdays+1)))-(2*marginwidth);
            if (barwidth<8) barwidth=8;
            $("#painbarchart").hide().append('<div id="painchartbarstitle">pain scores</div>');
            $("#painbarchart").append('<div id="painchartbars"><div>');
            maxpain = Math.max(...painscores.slice(0,graphdays));
            // create a placeholder to space out from the left side
            $("#painchartbars").append('<span class="barchartbar barchartelement placeholder"></span>');
            
            // create the pain bars
            for (i=0;i<graphdays;i++) {
                $("#painchartbars").append('<span class="barchartbar barchartelement"></span>');
                if (painscores[i]==0) {
                    $(".barchartbar:last").height("1px");
                } else if (painscores[i]>0) {
                    $(".barchartbar:last").height(((100*painscores[i]/maxpain))+"%");
                } else { // no data
                    $(".barchartbar:last").height("100%").addClass('nodata');
                }
            }
            // create the date titles
            $("#painbarchart").append('<div id="painchartbartitles"></div>');
            // insert a blank placeholder (under the pain score axis)
            $("#painchartbartitles").append('<span class="barchartbartitle barchartelement placeholder"></span>');
            for (i=0;i<graphdays;i++) {
                $("#painchartbartitles").append('<span class="barchartbartitle barchartelement"></span>');
                // skip titles if lots of elements
                if (graphdays<10) {
                    // every element
                    $(".barchartbartitle:last").append(formatdate(dates[i]));
                } else if (graphdays<21) {
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
            
            // create the pain score numbers
            $("#painchartbars").append('<span id="painscoreaxislabel" class="barchartelement"></span>');
            for (i=maxpain;i>0;i--) {
                $("#painscoreaxislabel").append("<div>"+i+"</div>");
                $("#painscoreaxislabel div:last").css("top",(200-i*(200/maxpain)));     
            }
            //$("#painscoreaxislabel").height(((100)-(marginwidth*2))+"%"); 
            $("#painscoreaxislabel div").height(100/(maxpain) + "%");
            // $('#painscoreaxislabel').width(barwidth).offset($('#painbarchartbars').offset());
            
            // space everything properly
            $(".barchartelement").width(barwidth).css("margin",marginwidth);

            // create a brief pause
            $("#painbarchart").fadeIn(pausetime,function () {
        
                // list the factors
                $("#painbarchart").append('<div id="factors"><div>');
                $("#factors").hide().append("<button>hide factors</button>");
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
                    // insert a blank placeholder
                    $('.factordates:last').append('<span class="factorelement placeholder"></span>');
                    var itsempty = true;
                    for (j=0;j<graphdays;j++) {
                        $('.factordates:last').append('<span class="factorelement"></span>');
                        try {
                            if (painfactors[j].includes(otherinfooptions[i])) {
                                $('.factorelement:last').addClass('litup');
                                itsempty = false;
                            }
                        } catch(err) {
                            // painfactors[j] not defined
                        } 
                    }
                    if (itsempty) {
                        $('.factor:last').remove();
                    } else {
                        $('.factor:last').append('<div class="factorname">'+otherinfooptions[i]+'</div>');
                    }
                }
                $(".factorelement").width(barwidth).css("margin",marginwidth);
        
                // create another brief pause
                $("#factors").fadeIn(pausetime,function () {
        
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
                    for (i=0;i<meds.length;i++) {
                        printdebug("printing medication " + meds[i][0]);
                        $('#meds').append('<div class="medd"><div class="meddates"></div></div>');
                        $('.meddates:last').append('<span class="medelement placeholder"></span>');
                        itsempty = true;
                        for (j=0;j<graphdays;j++) {
                            $('.meddates:last').append('<span class="medelement"></span>');
                            // printdebug("comparing " + painmeds[j] + " with " + meds.medication[i].name);
                            try {
                                if (painmeds[j].includes(meds[i][0])) {
                                    $('.medelement:last').addClass('litup');
                                    itsempty=false;
                                }
                            } catch(err) {
                                // painmeds[j] not defined or meds[i] undefined
                            }
                        }
                        if (itsempty) {
                            $('.medd:last').remove();
                        } else {
                            $('.medd:last').append('<div class="medname">' + meds[i][0] + '</div>');
                        }
                    }
                    
                    $(".medelement").width(barwidth).css("margin",marginwidth);




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
                    $("#painchartcontrols").append("<button>all time</button").children().last().click(function() {
                        initPainChart(-1,showHours);    
                    });
                });
            });
        });
    });
}