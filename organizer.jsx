
#include 'moment.min.js'

clearConsole();

// Mode, set 0 = clear,
//           1 = generate
//           3 = test

var mode = 0;


var month = 5;
var year = 2016;


var myDocument = app.activeDocument;


// Zero indexed, starting at sunday=0.
var allowedDaysOfWeekToStart = [1, 5];


var miniPageIndices = {
    0: {
        0: [ 4, 17, 20,  1],
        1: [ 8, 13, 16,  5]
    },
    1: {
        0: [ 2, 19, 18,  3],
        1: [ 6, 15, 14,  7]
    },
    2: {
        0: [10, 11,  0,  0],
        1: [ 0,  0,  0,  0] 
    },
    3: {
        0: [ 0,  0, 12,  9],
        1: [ 0,  0,  0,  0]
    }
}

// New orientation, makes use of all pages.
miniPageIndices = {
    0: {
        0: [16, 17, 24,  9],
        1: [ 8, 25, 32,  1]
    },
    1: {
        0: [10, 23, 18, 15],
        1: [ 2, 31, 26,  7]
    },
    2: {
        0: [14, 19, 22, 11],
        1: [ 6, 27, 30,  3]
    },
    3: {
        0: [12, 21, 20, 13],
        1: [ 4, 29, 28,  5]
    }
}


var templateLayer = getLayer('Template Content');
var generatedLayer = getLayer('Generated Content');


var page0 = myDocument.pages.item(0);
var page1 = myDocument.pages.item(1);
var page2 = myDocument.pages.item(2);
var page3 = myDocument.pages.item(3);
var pageWidth  = 792;  // 792
var pageHeight = 612;  // 612
var miniPageWidth  = pageWidth / 4;
var miniPageHeight = pageHeight / 2;


var dayHeader   = getPageItem(templateLayer, 'day_header');
var notesHeader = getPageItem(templateLayer, 'notes_header');
var sepLine     = getPageItem(templateLayer, 'sep_line');
var titleGroup  = getPageItem(templateLayer, 'title_group');
var backGroup   = getPageItem(templateLayer, 'back_group');
var testText    = getPageItem(templateLayer, 'test_text');

var chosenDay = getDay(2016, 2);
var currentDay = chosenDay.clone();
var nextMonth = chosenDay.clone().add(1, 'month');

preRewindDay(currentDay);


if (mode == 0) {
	clearLayer(generatedLayer);
} else if (mode == 1) {
	clearLayer(generatedLayer);
	generateItems();
} else if (mode == 3) {
	clearLayer(generatedLayer);
	generateTest();
}


function generateTest() {
	var totalPages = 32;
	for (var i = 1; i <= totalPages; i++) {
		var newTestText = duplicateToMiniPage(testText, i);
		newTestText.contents = i + '';
	}
}

function clearLayer(layer) {	
	var pageItems = layer.pageItems;
	log(pageItems.length);
	for (var i = pageItems.length; i >= 0; i--) {
		var item = pageItems.item(i);
		try {
			item.remove();
		} catch(a) { }
	}
}

var notesMode, counter, miniPage;
function generateItems() {
	
	var newTitleGroup = duplicateToMiniPage(titleGroup, 1);
	replaceTaggedText(newTitleGroup, 'February', chosenDay.format('MMMM'));
	replaceTaggedText(newTitleGroup, '2015y', chosenDay.format('YYYY'));
	var newBackGroup = duplicateToMiniPage(backGroup, 32);

	notesMode = false;
	counter = 1;
	miniPage = 4;
	while (currentDay.month() < nextMonth.month()) {
		
		if (notesMode) {
			log(miniPage + ': Outputting notes');
			outputNotes();
			currentDay.add(1, 'day');
			notesMode = false;
			
		} else {
			// Not in notes mode.
			log(miniPage + ': Outputting day: ' + currentDay.format('ddd, M/D'));
			outputDayHeader();

			if (currentDay.format('dddd') == 'Sunday') {
				notesMode = true;
			} else {
				currentDay.add(1, 'day');
			}	
		}

		if (counter % 2 == 1) {
			log(miniPage + ': SEPARATOR');
			outputSeperatorLine();
		} else {
			miniPage++;
		}

		counter++;
	}
}

function outputSeperatorLine() {
	var newSepLine = duplicateToMiniPage(sepLine, miniPage);
}

function outputNotes() {
	var newNotes = duplicateToMiniPage(notesHeader, miniPage);
	if (counter % 2 == 1) {
		// At the top.
	} else {
		// At the bottom.
		newNotes.move(undefined, [0, pageHeight / 4]);
	}
}

// Using global variables: currentDay, counter, miniPage
function outputDayHeader() {
	var newDayHeader = duplicateToMiniPage(dayHeader, miniPage);
	replaceTaggedText(newDayHeader, 'Monday', currentDay.format('dddd'));
	replaceTaggedText(newDayHeader, '2/1', currentDay.format('M/D'));
	if (counter % 2 == 1) {
		// At the top.
	} else {
		// At the bottom.
		newDayHeader.move(undefined, [0, pageHeight / 4]);
	}
	
}

// Rewind to first allowable day to start.
function preRewindDay(day) {
	var allowedDaysOfWeekToStart = [1, 5];
	while ( arrayIndexOf (allowedDaysOfWeekToStart, day.day()) < 0 ) {
		day.subtract(1, 'day');
	}
}

// Also moves the item to the generated content layer.
function duplicateToMiniPage(pageItem, miniPage) {
	
	// Store current coords, as offset in new minipage.
	var bounds = pageItem.geometricBounds;
	var itemX = bounds[1];
	var itemY = bounds[0];
	
	// Normalize itemX, itemY to represent a correct minipage offset.
	itemX = itemX % miniPageWidth;
	itemY = itemY % miniPageHeight;

	// Compute new coords.
	var info = getMiniPageInfo(miniPage);
	var pageIndex = info[0];
	var miniX = info[1]
	var miniY = info[2];
	
	var duplicate = pageItem.duplicate();
	duplicate.move(generatedLayer);
	
	duplicate.move(myDocument.pages.item(parseInt(pageIndex)));
	duplicate.move([miniX + itemX, miniY + itemY]);
	
	return duplicate;
}


function getMiniPageInfo(miniPageNumber) {
	for (var page in miniPageIndices) {
		var rows = miniPageIndices[page];
		for (var row in rows) {
			//$.writeln('rowVal: ' + rows[row].indexOf(3));
			var column = arrayIndexOf(rows[row], miniPageNumber);
			if (column >= 0) {
				var coords = coordsFromMiniPage(row, column); 
				return [page, coords[0], coords[1]];
			}
		}
	}
	return 'not found';
}

function coordsFromMiniPage(row, col) {
    var numRows = 2;
    var numCols = 4;
    return [pageWidth / numCols * col, pageHeight / numRows * row];
}

function arrayIndexOf(array, element) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] == element) {
			return i;
		}
	}
	return -1;
}

function getDay(year, month) {
    var monthStr = padWithZerosToWidth(month, 2);
    return moment(year + '-' + monthStr + '-' + '01');
}

function padWithZerosToWidth(str, width) {
    str = str + '';
    while (str.length < width) {
        str = '0' + str;
    }
    return str;
}

function replaceTaggedText(pageItem, tag, newText) {

	// If I am not changeGreppable, then recurse down to my children.
	if (!('changeGrep' in pageItem) && pageItem.pageItems) {
		for (var i = 0; i < pageItem.pageItems.length; i++) {
			replaceTaggedText(pageItem.pageItems.item(i), tag, newText);
		}
	} 
	else {
		
		app.findGrepPreferences = NothingEnum.nothing;
		app.changeGrepPreferences = NothingEnum.nothing;

		app.findGrepPreferences.findWhat = '(<' + tag + '>)';
		app.changeGrepPreferences.changeTo = newText;
		pageItem.changeGrep();    
		
		app.findGrepPreferences = NothingEnum.nothing;
		app.changeGrepPreferences = NothingEnum.nothing;
	}
}


function getLayer(layerName) {
    return app.activeDocument.layers.item(layerName);
}


function getPageItem(parent, label) {
    var pageItems = parent.pageItems;
    for (var i = 0; i < pageItems.length; i++) {
        var currItem = pageItems.item(i);
        if (currItem.label == label) {
            return currItem;
        }
    }
}

function clearConsole() {
    var extendscriptApp = BridgeTalk.getSpecifier("estoolkit");
    if(extendscriptApp) {
        var bt = new BridgeTalk;
        bt.target = extendscriptApp;
        bt.body = "app.clc()";
        bt.send();
    }
}

function log(obj) {
	$.writeln(obj);
}
