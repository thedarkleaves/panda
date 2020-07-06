var daynames = ["S","M","T","W","T","F","S"];
var startMonday = false;

/**
 * Print a calendar with a specific date highlighted
 * 
 * @param {String} wheretoprint The ID (including hash) to print the calendar to
 * @param {String} view either "month" or "week"
 * @param {Date} highlightedDate A date to highlight
 * @param {Function} makeCalendarContent A function that takes a Date as a parameter and returns HTML to put into the box
 * @param {Function} clickCalendarContent A function that takes a Date as a paramater and fires when the date is clicked
 */
function printCalendar(wheretoprint,view,highlightedDate,makeCalendarContent,clickCalendarContent) {

    // parse the string
    try {
        var hlDayOfWeek = highlightedDate.getDay();
        var hlDay = highlightedDate.getDate();
        var hlMonth = highlightedDate.getMonth();
        var hlYear = highlightedDate.getYear();
    } catch(err) {
        throw "Invalid calendar highlight date: " + highlightedDate.toString();
    }

    // empty the calendar and create a new one
    $(wheretoprint).empty();
    // print the days
    $(wheretoprint).append('<div id="calendar_toprow" class="calendar_row"></div>')
    for (i=0;i<7;i++) {
        $("#calendar_toprow").append('<span class="calendar topbox"></span>');
        if (startMonday) {
            if (i<6) {
                $(".calendar.topbox:last").append(daynames[i+1]);
            } else {
                $(".calendar.topbox:last").append(daynames[0]);
            }
        } else {
            $(".calendar.topbox:last").append(daynames[i]);
        }
    }
    
    // subfunction to print the days
    function printDay(dateToPrint) {
        $(".calendar_row:last").append('<span class="calendar daybox"></div>');
        // highlight if appropriate
        if (dateToPrint.getDate() == highlightedDate.getDate()) {
            $(".daybox:last").addClass("highlighted");
        }
        // add a date label and an invisible date storage thing
        $(".daybox:last").append('<span class="calendar dayboxdate">' + dateToPrint.getDate() + '</div>');
        $(".daybox:last").append('<span class="invisibledatestoragething">' + dateToPrint.toDateString() + '</span>');
        // add a future flag for dates in the future
        var today = new Date();
        if (dateToPrint>today) {
            $(".daybox:last").addClass("future");
        }
        // add some content
        $(".daybox:last").append('<span class="calendar dayboxcontent">' + makeCalendarContent(dateToPrint) + '</div>');
        $(".daybox:last").click(function() {
            var clickdate = new Date(($(this).find('.invisibledatestoragething').html()));
            clickCalendarContent(clickdate);
        });
    
    }

    // figure out week or month view
    if (view=="week") {
        // figure out first day of the week
        var firstDayOfWeek = new Date(highlightedDate);
        if (startMonday) {
            firstDayOfWeek.setDate(highlightedDate.getDate() - hlDayOfWeek + 1);
        } else {
            firstDayOfWeek.setDate(highlightedDate.getDate() - hlDayOfWeek);
        }


        // print the days
        $(wheretoprint).append('<div class="calendar_row"></div>');
        for (i=0;i<7;i++) {
            var thisDay = new Date(firstDayOfWeek);
            thisDay.setDate(firstDayOfWeek.getDate()+i);
            printDay(thisDay);
        }
    } else if (view=="month") {
        var firstDayOfMonth = new Date(highlightedDate);
        // work out how many days this month (by setting the last day of the month)
        firstDayOfMonth.setMonth(firstDayOfMonth.getMonth()+1);
        firstDayOfMonth.setDate(0);
        var daysThisMonth = firstDayOfMonth.getDate();
        // set the first day of the month
        firstDayOfMonth.setDate(1);
        
        // create the first row (which probably has some blanks)
        $(wheretoprint).append('<div class="calendar_row"></div>');
        // print some blanks
        var shootblanks = firstDayOfMonth.getDay();
        if (startMonday) {
            if (shootblanks==0) {
                // start on a sunday, create 6 blanks
                shootblanks = 6;
            } else {
                shootblanks--;
            }
        } 
        for (i=0;i<shootblanks;i++) {
            $(".calendar_row:last").append('<span class="calendar daybox blank"></div>');    
        }
    
        // print the days
        for (i=0;i<daysThisMonth;i++) {
            var thisDay = new Date(firstDayOfMonth);
            thisDay.setDate(firstDayOfMonth.getDate() + i);
            printDay(thisDay);
            var thisDayDayOfWeek = thisDay.getDay();
            if ((startMonday && (thisDayDayOfWeek==0)) || (!startMonday && (thisDayDayOfWeek==6))) {
                // start a new week (row)
                $(wheretoprint).append('<div class="calendar_row"></div>');        
            }
        }
        
    } else {
        throw "Invalid calendar view: " + view;
    }
}
