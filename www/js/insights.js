var yesSum = 1;
var yesCount = 2;
var noSum = 3;
var noCount = 4;
var allPainScores = []
var painMean = 0;
var painSD = 0;

function printInsights(elementToPrintTo) {

    // TODO: Validation, probably fail if n<10? need to think about it a bit
    $(elementToPrintTo).empty().append("Crunching the numbers...<br>");
    
    // create a n*4 matrix (where n is the number of factors)
    var factorsInsightsMatrix = [];
    for (i=0;i<otherinfooptions.length;i++) {
        factorsInsightsMatrix[i] = new Array(4);
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
    $("#importantInsights").append("Average pain score: " + painMean);
    painSD = 0;
    for (i=0;i<allPainScores.length;i++) {
        painSD+=Math.pow((allPainScores[i] - painMean),2);
    }
    painSD = Math.sqrt(painSD / allPainScores.length); 

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
            if ((yesMean-1.96*yesSeE) > (noMean+1.96*noSE)) {
                $("#importantInsights").append('<div class="insight">On days marked: <b>' + otherinfooptions[i] + '</b>, pain was significantly higher.</div>');
                $("#importantInsights").append('<div class="insight">Yes: ' + yesMean.toFixed(1) + ' | No: ' + noMean.toFixed(1) + '</div>');
            } else {
                $("#lessImportantInsights").append('<div class="insight">On days marked: <b>' + otherinfooptions[i] + '</b>, pain was a little higher.</div>');
                $("#lessImportantInsights").append('<div class="insight">Yes: ' + yesMean.toFixed(1) + ' | No: ' + noMean.toFixed(1) + '</div>');
            }
        } else if (noMean>yesMean) {
            // pain is higher when the factor is no
            if ((noMean-1.96*noSE) > (yesMean+1.96*yesSE)) {
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