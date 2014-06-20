/* Copyright (c) 2013-2014 The Tagspaces Authors. All rights reserved.
 * Use of this source code is governed by a AGPL3 license that 
 * can be found in the LICENSE file. */
/* global define, Handlebars, isCordova  */
define(function(require, exports, module) {
"use strict";

    var extensionTitle = "Card";
    var extensionID = "perspectiveCard";  // ID should be equal to the directory name where the ext. is located   
    var extensionType =  "perspective";
    var extensionIcon = "fa fa-th";
    var extensionVersion = "1.0";
    var extensionManifestVersion = 1;
    var extensionLicense = "AGPL";
    
    console.log("Loading "+extensionID);
	
	var TSCORE = require("tscore");
    var extensionDirectory = TSCORE.Config.getExtensionPath() + "/" + extensionID;
    var UI;

	var init = function () {
        console.log("Initializing perspective "+extensionID);
        require([
            extensionDirectory+'/perspectiveUI.js',
            "text!"+extensionDirectory+'/toolbar.html',
            'css!'+extensionDirectory+'/styles.css'
            ], function(extUI, toolbarTPL) {
                var toolbarTemplate = Handlebars.compile( toolbarTPL );                
                UI = new extUI.ExtUI(extensionID);                          
                UI.buildUI(toolbarTemplate);
				platformTuning();                
            }
        );
	};
	
	var platformTuning = function() {
		if(isCordova) {
			$("#"+extensionID+"IncludeSubDirsButton").hide();
		}
        var index = [];
        TSCORE.IO.scanDirectory(TSCORE.currentPath, index, true, 1);
        console.log(index);
        _.each(index, function (value) { 
            fs.watch(value["path"], function (event, filename) {
                console.log('event is: ' + event + ", " + filename);
                if (filename) {
                    console.log('filename provided: ' + filename);
                    // TSCORE.navigateToDirectory(TSCORE.currentPath);
                    TSCORE.IO.createDirectoryIndex(TSCORE.currentPath);
                } else {
                    console.log('filename not provided');
                }
            });
        });
	};	
	
	var load = function () {
        console.log("Loading perspective "+extensionID);
		if(UI === undefined) {
			window.setTimeout(function() { UI.reInit(); }, 1000);
		} else {
            UI.reInit();    
        }	
	};
   
    var clearSelectedFiles = function() {
    if(UI !== undefined) {
        UI.clearSelectedFiles();
    }
    };
    
    var removeFileUI = function(filePath) {
        UI.removeFileUI(filePath);
    };    

    var updateFileUI = function(oldFilePath, newFilePath) {
        UI.updateFileUI(oldFilePath, newFilePath);
    };
	
    var getNextFile = function (filePath) {
        return UI.getNextFile(filePath);
    };

    var getPrevFile = function (filePath) {
        return UI.getPrevFile(filePath);
    };	

    // Vars
    exports.Title                   = extensionTitle;
    exports.ID                      = extensionID;   
    exports.Type                    = extensionType;
    exports.Icon                    = extensionIcon;
    exports.Version                 = extensionVersion;
    exports.ManifestVersion         = extensionManifestVersion;
    exports.License                 = extensionLicense;
    
    // Methods
    exports.init                    = init;
    exports.load                    = load;
    exports.clearSelectedFiles      = clearSelectedFiles;
    exports.getNextFile             = getNextFile;
    exports.getPrevFile             = getPrevFile;	
    exports.removeFileUI            = removeFileUI;
    exports.updateFileUI            = updateFileUI;

});