var yesSum = 0;
var yesCount = 1;
var noSum = 2;
var noCount = 3;
var allPainScores = []
var painThisWeek = [];
var painLastWeek = [];
var painThisMonth = [];
var painLastMonth = [];
var painMean = 0;
var painSD = 0;

function printInsights(elementToPrintTo) {

    // Validation, only run if n>=7 
    if (paindiary.length<7) {
        $(elementToPrintTo).empty().append("Cannot calculate insights until at least 7 days entered...");
    } else {
        $(elementToPrintTo).empty().append("Crunching the numbers...<br>");
        
        // create a n*4 matrix (where n is the number of factors)
        var factorsInsightsMatrix = [];
        for (i=0;i<otherinfooptions.length;i++) {
            factorsInsightsMatrix[i] = [0,0,0,0];
        }
        
        // reset painscore list to caluclate the mean and SD
        allPainScores = [];
        painMean = 0;
        painThisWeek = [];
        painLastWeek = [];
        painThisMonth = [];
        painLastMonth = [];
        
        // calculate 7 and 30 days ago
        var today = todayString();
        var weekago = addDays(today,-7);
        var twoweeksago = addDays(today,-14);
        var monthago = addDays(today,-30);
        var twomonthsago = addDays(today,-60);
        
        $(elementToPrintTo).empty().append("Creating pain matrix...<br>");
        $(elementToPrintTo).empty().append('<div id="insightsloadingtemp"></div>');
        
        // TODO: Create option to only include last x amount of time
        // TODO: Compare current month with last month
        
        // fill the matrix
        for (i=0;i<paindiary.length;i++) {
            // add the pain score to the global painscore list 
            allPainScores.push(parseInt(paindiary[i].painscore));
            // add pain scores from this week and last to the lists
            if (paindiary[i].date>weekago) {
                painThisWeek.push(parseInt(paindiary[i].painscore));
            } else if (paindiary[i].date>twoweeksago) {
                painLastWeek.push(parseInt(paindiary[i].painscore));
            }
            // add pain scores from this month and last to the lists
            if (paindiary[i].date>monthago) {
                painThisMonth.push(parseInt(paindiary[i].painscore));
            } else if (paindiary[i].date>twomonthsago) {
                painLastMonth.push(parseInt(paindiary[i].painscore));
            }            

            $("#insightsloadingtemp").empty().append(paindiary[i].date + '<div id="insightsloadingtemp1"></div>');

            // for each factor check if this day has it listed or not
            for (j=0;j<otherinfooptions.length;j++) {
                $("#insightsloadingtemp1").empty().append(otherinfooptions[j] + '<br>');
                var currentFactorYes = false;
                // check if the date has factors listed
                if ((paindiary[i].otherfactors!=undefined) && (paindiary[i].otherfactors.length>0)) {
                    // check if one of the factors is a match
                    for (k=0;k<paindiary[i].otherfactors.length;k++) {
                        if (otherinfooptions[j] == paindiary[i].otherfactors[k]) {
                            currentFactorYes = true;
                            break;
                        }
                    }
                }
                $("#insightsloadingtemp1").empty().append('Updating matrix');
                // update the matrix
                if (currentFactorYes) {
                    factorsInsightsMatrix[j][yesSum]+=parseInt(paindiary[i].painscore,10);
                    factorsInsightsMatrix[j][yesCount]++;
                    printdebug(otherinfooptions[j] + ': ' + factorsInsightsMatrix[j][yesCount] + ' | ' + factorsInsightsMatrix[j][yesSum]);
                } else {
                    factorsInsightsMatrix[j][noSum]+=parseInt(paindiary[i].painscore,10);
                    factorsInsightsMatrix[j][noCount]++;
                }
            }
        }
        $(elementToPrintTo).empty();
        $(elementToPrintTo).append('<div id="importantInsights"></div><div id="lessImportantInsights"></div>');
        // work out the mean and standard devation of the pain scores
        painMean = average(allPainScores);
        
        $("#importantInsights").append('<div class="insight">average pain score: ' + painMean.toFixed(1) + '</div>');
        
        // if at least 2 days entered in the last week show average
        if (painThisWeek.length>2) {
            var thisWeekMean = average(painThisWeek);
            $("#importantInsights").append('<div class="insight">last 7 days: ' + thisWeekMean.toFixed(1) + '</div>');
            // if at least 2 days entered the week prior, give that too
            if (painLastWeek.length>2) {
                var lastWeekMean = average(painLastWeek);
                $("#importantInsights div").last().append(' (prior 7 days: ' + lastWeekMean.toFixed(1) + ')');
            }
        }

        // if at least 2 days entered in the last month show average
        if (painThisMonth.length>2) {
            var thisMonthMean = average(painThisMonth);
            $("#importantInsights").append('<div class="insight">last 30 days: ' + thisMonthMean.toFixed(1) + '</div>');
            // if at least 2 days entered the month prior, give that too
            if (painLastMonth.length>2) {
                var lastMonthMean = average(painLastMonth);
                $('#importantInsights div').last().append(' (prior 30 days: ' + lastMonthMean.toFixed(1) + ')');
            }
        }

        painSD = 0;
        for (i=0;i<allPainScores.length;i++) {
            painSD+=Math.pow((allPainScores[i] - painMean),2);
        } // painSD now is the sum of the squared differences
        painSD = Math.sqrt(painSD / allPainScores.length); 
        
        $("#importantInsights").append('<div class="question">key insights <button class="helpbutton" id="helpbutton_insights">?</button></div>');
        $("#lessImportantInsights").append('<div class="question">insights to consider</div>');
        $("#helpbutton_insights").click(function(){
            popupmessage("'Key Insights' are statistically significant insights, and therefore " +
            "there is a 95% chance these are not due to chance (technical info: significant at p<0.05 with bonferroni correction.)" +
            "\n'Insights to ponder' are not statistically significant, therefore might be due to chance.");
        });
        
        /** Work out the confidence intervals based on t-tables with Bonferroni corrections
         * 
         * for n stats confidence interval is (1-0.05/n)
         * for 1 stat 95: 1.96
         * for 2 stats 97.5 (round to 98: 2.326)
         * for 3 stats 98.3 (round to 98: 2.326)
         * for 4 stats 98.8 (round to 99: 2.576)
         * for 5 stats 99.0: 2.576
         * for 10 stats 99.5 (round to 99.8): 3.090
         * for 25 stats 99.8: 3.090
         * for 50 stats 99.9: 3.291
         */
        var confidenceStat;
        if (otherinfooptions.length<=1) {
            confidenceStat = 1.96;
        } else if (otherinfooptions.length<=3) {
            confidenceStat = 2.326; 
        } else if (otherinfooptions.length<=5) {
            confidenceStat = 2.576;
        } else if (otherinfooptions.length<=50) {
            confidenceStat = 3.090;
        } else {
            confidenceStat = 3.291
        }

        // process the matrix to figure out if each factor is significant
        for (i=0;i<otherinfooptions.length;i++) {
            // calculate the standard error for this factor Yes
            var yesSE = painSD / Math.sqrt(factorsInsightsMatrix[i][yesSum]);
            var yesMean = factorsInsightsMatrix[i][yesSum] / factorsInsightsMatrix[i][yesCount];
        
            // calculate the standard error for this factor No
            var noSE = painSD / Math.sqrt(factorsInsightsMatrix[i][noSum]);
            var noMean = factorsInsightsMatrix[i][noSum] / factorsInsightsMatrix[i][noCount];
        

            if (yesMean>noMean) {
                // pain is higher when the factor is yes
                if ((yesMean-confidenceStat*yesSE) > (noMean+confidenceStat*noSE)) {
                    $("#importantInsights").append('<div class="insight">pain was significantly higher with <b>' + otherinfooptions[i] + '</b>.</div>');
                    $("#importantInsights").append('<div class="insight">(with ' + otherinfooptions[i]+ ': ' + yesMean.toFixed(1) + ', without: ' + noMean.toFixed(1) + ')</div>');
                } else {
                    $("#lessImportantInsights").append('<div class="insight">pain was a bit higher with <b>' + otherinfooptions[i] + '</b>.</div>');
                    $("#lessImportantInsights").append('<div class="insight">(with ' + otherinfooptions[i]+ ': ' + yesMean.toFixed(1) + ', without: ' + noMean.toFixed(1) + ')</div>');
                }
            } else if (noMean>yesMean) {
                // pain is higher when the factor is no
                if ((noMean-confidenceStat*noSE) > (yesMean+confidenceStat*yesSE)) {
                    $("#importantInsights").append('<div class="insight">pain was significantly lower with <b>' + otherinfooptions[i] + '</b>.</div>');
                    $("#importantInsights").append('<div class="insight">(with ' + otherinfooptions[i]+ ': ' + yesMean.toFixed(1) + ', without: ' + noMean.toFixed(1) + ')</div>');
                } else {
                    $("#lessImportantInsights").append('<div class="insight">pain was a bit lower with <b>' + otherinfooptions[i] + '</b>.</div>');
                    $("#lessImportantInsights").append('<div class="insight">(with ' + otherinfooptions[i]+ ': ' + yesMean.toFixed(1) + ', without: ' + noMean.toFixed(1) + ')</div>');
                }
            } else {
                // pain is exactly the same between factors
                $("#lessImportantInsights").append('<div class="insight">pain was the same with or without <b>' + otherinfooptions[i] + '</b>.</div>');
                $("#lessImportantInsights").append('<div class="insight">(with ' + otherinfooptions[i]+ ': ' + yesMean.toFixed(1) + ', without: ' + noMean.toFixed(1) + ')</div>');
            }
        }
    }
}

/**
 * Add numDays to dateString (negative values for backwards)
 *
 * @param {String} dateString in format yyyy.mm.dd
 * @param {Int} numDays number of days to subtract (negative values ok)
 */
function addDays(dateString, numDays) {
    // do 28 days at time (recursive)
    if (numDays>28) {
        return addDays(addDays(dateString,28),(numDays-28));
    } else if (numDays<-28) {
        return addDays(addDays(dateString,-28),(numDays+28));
    } else {
        try {
            var breakdown = dateString.split(".");
            var year = parseInt(breakdown[0]);
            var month = parseInt(breakdown[1]);
            var day = parseInt(breakdown[2]);
        } catch {
            printdebug("Invalid DateString: " + dateString);
            return "invalid dateString";
        }
        day += numDays;
        if (day<1) {
            month--;
            if (month==1 || month==3 || month==5 || month==7 || month==8 || month==10 || month==12) {
                day+=31;
            } else if (month==2) {
                if (year%4==0) {
                    day+=29;
                } else {
                    day+=28;
                }
            } else {
                day+=30;
            }
        } else if (day>28) {
            if ((month==1 || month==3 || month==5 || month==7 || month==8 || month==10 || month==12) && day>31) {
                day -= 31;
                month++;
            } else if ((month==2) && (year%4==0) && day>29) {
                day-= 29;
                month++;
            } else if ((month==2) && day>28) {
                day-=28;
                month++;
            } else if (day>30) {
                day-=30;
                month++;
            }
        }
        if (month<1) {
            month = 12;
            year--;
        } else if (month>12) {
            month=1;
            year++;
        }
        // pad with zeros
        if (month<10) { month = "0" + month; }
        if (day<10) { day = "0" + day; }
        
        return year + "." + month + "." + day;
    }
}

/**
 * Calculate the mean of an array of numbers
 * @param {array} painScores Array of numbers
 */
function average(painScores) {
    var sum = 0;
    for (var i=0; i<painScores.length; i++) {
        sum+=painScores[i];
    }
    return sum/painScores.length;
}