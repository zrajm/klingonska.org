buster.testCase("Some Klingon stuff", {
    "splitSyllable() –": {
        "<b>nenghep</b> –&gt; <b>nen·ghep</b>": function() {
            assert.equals(splitSyllable("nenghep"), ["nen", "ghep"]);
        },
        "<b>tlhIngan</b> –&gt; <b>tlhI·ngan</b>": function() {
            assert.equals(splitSyllable("tlhIngan"), ["tlhI", "ngan"]);
        },
    },
    "insertRules() & insertRule() –": {
        "Bulding a simple Finite-State Machine": function () {
            var syllables = { "wa'"  : 'num', "maH"  : 'num1', "DIch" : 'num2' },
                goodRules = {}, numRules = {};
            goodRules["wa'"]  = [{ "tag": "num",  "rules": '>rules<' }];
            goodRules["maH"]  = [{ "tag": "num1", "rules": '>rules<' }];
            goodRules["DIch"] = [{ "tag": "num2", "rules": '>rules<' }];
            goodRules["Sa"]   = [{
                "rules": {
                    "nID": [{ "tag": "num1", "rules": '>rules<' }]
                }
            }];
            insertRules(numRules, syllables, '>rules<');    // Numerical Element Rules
            insertRule(numRules, ["Sa", "nID"], 'num1', '>rules<'); // FIXME!!
            assert.equals(numRules, goodRules);
        },
    }

});

//eof
