var yesSum = 0;
var yesCount = 1;
var noSum = 2;
var noCount = 3;
var allPainScores = []
var painMean = 0;
var painSD = 0;

function printInsights(elementToPrintTo) {

    // TODO: Validation, probably fail if n<10? need to think about it a bit
    $(elementToPrintTo).empty().append("Crunching the numbers...<br>");
    
    // create a n*4 matrix (where n is the number of factors)
    var factorsInsightsMatrix = [];
    for (i=0;i<otherinfooptions.length;i++) {
        factorsInsightsMatrix[i] = [0,0,0,0];
    }
    
    // reset painscore list to caluclate the mean and SD
    allPainScores = [];
    painMean = 0;
    
    $(elementToPrintTo).empty().append("Creating pain matrix...<br>");
    $(elementToPrintTo).empty().append('<div id="insightsloadingtemp"></div>');
    
    // fill the matrix
    for (i=0;i<paindiary.length;i++) {
        // add the pain score to the global painscore list and update the global mean
        allPainScores.push(parseInt(paindiary[i].painscore));
        painMean+=parseInt(paindiary[i].painscore,10);
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
    painMean = (painMean / allPainScores.length);
    $("#importantInsights").append("Average pain score: " + painMean.toFixed(1));
    painSD = 0;
    for (i=0;i<allPainScores.length;i++) {
        painSD+=Math.pow((allPainScores[i] - painMean),2);
    } // painSD now is the sum of the squared differences
    painSD = Math.sqrt(painSD / allPainScores.length); 
    
    $("#importantInsights").append('<div class"question">Important Insights</div>');
    $("#lessImportantInsights").append('<div class="question">Insights that might not be important</div>');
    
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
                $("#importantInsights").append('<div class="insight">On days marked: <b>' + otherinfooptions[i] + '</b>, pain was significantly higher.</div>');
                $("#importantInsights").append('<div class="insight">Yes: ' + yesMean.toFixed(1) + ' | No: ' + noMean.toFixed(1) + '</div>');
            } else {
                $("#lessImportantInsights").append('<div class="insight">On days marked: <b>' + otherinfooptions[i] + '</b>, pain was a little higher.</div>');
                $("#lessImportantInsights").append('<div class="insight">Yes: ' + yesMean.toFixed(1) + ' | No: ' + noMean.toFixed(1) + '</div>');
            }
        } else if (noMean>yesMean) {
            // pain is higher when the factor is no
            if ((noMean-confidenceStat*noSE) > (yesMean+confidenceStat*yesSE)) {
                $("#importantInsights").append('<div class="insight">On days marked: <b>' + otherinfooptions[i] + '</b>, pain was significantly lower.</div>');
                $("#importantInsights").append('<div class="insight">Yes: ' + yesMean.toFixed(1) + ' | No: ' + noMean.toFixed(1) + '</div>');
            } else {
                $("#lessImportantInsights").append('<div class="insight">On days marked: <b>' + otherinfooptions[i] + '</b>, pain was a little lower.</div>');
                $("#lessImportantInsights").append('<div class="insight">Yes: ' + yesMean.toFixed(1) + ' | No: ' + noMean.toFixed(1) + '</div>');
            }
        } else {
            // pain is exactly the same between factors
            $("#lessImportantInsights").append('<div class="insight">Days were the same whether <b>' + otherinfooptions[i] + '</b> was marked or not.</div>');
            $("#lessImportantInsights").append('<div class="insight">Yes: ' + yesMean.toFixed(1) + ' | No: ' + noMean.toFixed(1) + '</div>');
        }
    }    
}