//Custom JavaScript Functions by Shawn Olson
//Copyright 2006-2008
//http://www.shawnolson.net
//If you copy any functions from this page into your scripts, you must provide credit to Shawn Olson & http://www.shawnolson.net
//*******************************************

function changecss(cssclass,element,value) {
    //Last Updated on June 23, 2009
    //documentation for this script at
    //http://www.shawnolson.net/a/503/altering-css-class-attributes-with-javascript.html
    var cssRules;
    
    var added = false;
    for (var S = 0; S < document.styleSheets.length; S++){
        
        if (document.styleSheets[S]['rules']) {
            cssRules = 'rules';
        } else if (document.styleSheets[S]['cssRules']) {
            cssRules = 'cssRules';
        } else {
            //no rules found... browser unknown
        }

        for (var R = 0; R < document.styleSheets[S][cssRules].length; R++) {
            if (document.styleSheets[S][cssRules][R].selectorText == cssclass) {
                if(document.styleSheets[S][cssRules][R].style[element]){
                    document.styleSheets[S][cssRules][R].style[element] = value;
                    added=true;
                    break;
                }
            }
        }
        if(!added){
            if(document.styleSheets[S].insertRule){
                document.styleSheets[S].insertRule(cssclass+' { '+element+': '+value+'; }',document.styleSheets[S][cssRules].length);
            } else if (document.styleSheets[S].addRule) {
                document.styleSheets[S].addRule(cssclass,element+': '+value+';');
            }
        }
    }
}

//[eof]
