/* Copyright (c) 2012-2014 The TagSpaces Authors. All rights reserved.
 * Use of this source code is governed by a AGPL3 license that 
 * can be found in the LICENSE file. */
/* global define, Handlebars, isWin, _  */
define(function(require, exports, module) {
"use strict";
    
console.log("Loading UI for perspectiveDefault");
    var TSCORE = require("tscore");
        
    var TMB_SIZES = [ "200px", "300px", "100px" ];

    var MONTH = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

    var PREVIEW_TAGS_CNT = 3;

    var supportedFileTypeThumnailing = ['jpg','jpeg','png','gif'];

    function ExtUI(extID) {


        this.extensionID = extID;
        this.viewContainer = $("#"+this.extensionID+"Container").empty();
        this.viewToolbar = $("#"+this.extensionID+"Toolbar").empty();
        this.viewFooter = $("#"+this.extensionID+"Footer").empty();

        this.currentGrouping = "folder"; // tagchain, day, month, year
        // this.currentGrouping = ""; // tagchain, day, month, year
        this.thumbEnabled = false;
        this.currentTmbSize = 0;
        this.searchResults = undefined;    
        this.supportedGroupings = [];
        
        this.supportedGroupings.push({"title":"Day","key":"day"});
        this.supportedGroupings.push({"title":"Month","key":"month"});
        this.supportedGroupings.push({"title":"Year","key":"year"});
        
        for(var i=0; i < TSCORE.Config.Settings.tagGroups.length; i++) {
            // Exclude smart tags and calculated tags 
            if( TSCORE.Config.Settings.tagGroups[i].key !== "SMR" &&
                TSCORE.Config.Settings.tagGroups[i].key !== "CTG" ) {
                this.supportedGroupings.push({
                    "title": TSCORE.Config.Settings.tagGroups[i].title,
                    "key": TSCORE.Config.Settings.tagGroups[i].key
                });                
            }
        }
    }
    
    var fileTileTmpl_old = Handlebars.compile('<li title="{{filepath}}" filepath="{{filepath}}" class="fileTile">\
               <p class="titleInFileTile">{{title}}</p><span class="tagsInFileTile">\
               {{#each tags}}\
               <button class="btn btn-sm tagButton fileTagsTile" tag="{{tag}}" filepath="{{filepath}}" style="{{style}}">{{tag}} <span class="caret"></span></button>\
               {{/each}}\
               </span><span class="fileExtTile">{{fileext}}</span>\
               <button class="btn btn-link fileTileSelector" filepath="{{filepath}}"><i class="fa fa-square-o"></i></button></p></li>');

    var fileTileTmpl2 = Handlebars.compile('\
            <div class="column">\
                <div class="portlet-header">{{folder}}</div>\
                <div class="area">\
                <div class="portlet">\
                <div class="portlet-header">{{title}}</div>\
                <div class="portlet-content">Lorem ipsum dolor sit amet, consectetuer adipiscing elit</div>\
            </div>\
        </div>');

    var fileTileTmpl = Handlebars.compile('\
            <div class="column">\
                <div class="portlet-header">{{folder}}</div>\
                <div class="area">\
                {{#each files}}\
                    <div class="portlet">\
                        <div class="portlet-header">{{title}}\
                        <div class="hiddenpath">{{filepath}}</div>\
                        </div>\
                        <div class="portlet-content">{{folder}} Lorem ipsum dolor sit amet, consectetuer adipiscing elit</div>\
                    </div>\
                {{/each}}\
                </div>\
               <div class="hiddenpath">{{filepath}}</div>\
        </div>');
  


    function tilt_direction(item) {
        var left_pos = item.position().left,
            move_handler = function (e) {
                if (e.pageX >= left_pos) {
                    item.addClass("right");
                    item.removeClass("left");
                } else {
                    item.addClass("left");
                    item.removeClass("right");
                }
                left_pos = e.pageX;
            };
        $("html").bind("mousemove", move_handler);
        item.data("move_handler", move_handler);
    }   

    ExtUI.prototype.createFolderTile = function(value) {
        //TODO minimize platform specific calls     
        console.log(value[0][TSCORE.fileListFILEPATH]);
        var filePath = pathUtils.dirname(value[0][TSCORE.fileListFILEPATH]);
        var folder = pathUtils.basename(filePath);
        var tmbPath = undefined;
        if(isCordova || isWeb) {
            tmbPath = filePath;            
        } else {
            tmbPath = "file:///" + filePath;  
        }       

        var context = {
                filepath: filePath, 
                folder: folder, 
                tmbpath: tmbPath, 
                // fileext: fileExt, 
                files: [], 
                title: folder,
                // tags : []    
        };
        
        for (var i=0; i < value.length; i++) { 
            context.files.push({title: value[i][TSCORE.fileListTITLE], 
                filepath: value[i][TSCORE.fileListFILEPATH],
                folder: pathUtils.basename(pathUtils.dirname(value[i][TSCORE.fileListFILEPATH])),
            });
        }    
        // XXX sort

        // if(fileTags.length > 0) {
        //     var tagString = ""+fileTags ;
        //     var tags = tagString.split(",");

        //     var tagCounter = 0;
        //     if (tags.length > PREVIEW_TAGS_CNT) {
        //         tagCounter = PREVIEW_TAGS_CNT+1;
        //         tags[PREVIEW_TAGS_CNT] = "...";
        //     } else {
        //         tagCounter = tags.length;                
        //     }
        //     for (var i=0; i < tagCounter; i++) { 
        //         context.tags.push({tag: tags[i], filepath: filePath, style: TSCORE.generateTagStyle(TSCORE.Config.findTag(tags[i]))});
        //     }   
        // }

        var template = fileTileTmpl(context);
        return template;
    };    
    
    ExtUI.prototype.initFileGroupingMenu = function () {
        var self = this;
        
        var suggMenu = $("#"+self.extensionID+"GroupingMenu");
    
        suggMenu.append($('<li>').append($('<a>', { 
            title: "Ungroup all elementes", 
            text: " Ungroup"
            })
            .prepend("<i class='fa fa-times-circle'></i>") 
            .click(function() {
                $("#"+self.extensionID+"GroupingButton")
                    .text(" Group ")
                    .prepend( "<i class='fa fa-group' />" )
                    .append( "<span class='caret'></span>" );                                
                self.switchGrouping("");
            })                
        )); 
        suggMenu.append('<li class="divider"></li>');

        // Adding context menu entries according to the taggroups
        for (var i=0; i < self.supportedGroupings.length; i++) {        
            suggMenu.append($('<li>').append($('<a>', { 
                    title: "Group by "+self.supportedGroupings[i].title, 
                    text: " "+self.supportedGroupings[i].title,
                    key: self.supportedGroupings[i].key,
                    group: self.supportedGroupings[i].title
                })
                .prepend( "<i class='fa fa-group' />" )            
                .click(function() {
                    $("#"+self.extensionID+"GroupingButton")
                        .text(" Grouped by "+$(this).attr("group")+" ")
                        .prepend( "<i class='fa fa-group' />" )
                        .append( "<span class='caret'></span>" );                                
                    self.switchGrouping($(this).attr("key"));
                })                
            ));              
        }
    };
    
    ExtUI.prototype.buildUI = function(toolbarTemplate) {
        console.log("Init UI module");
               
        var self = this;
        
        var context = {
            id: this.extensionID
        };

        this.viewToolbar.append(toolbarTemplate(context));


        $("#"+this.extensionID+"ToogleSelectAll")
            .click(function() {
                var checkIcon = $(this).find("i");
                if(checkIcon.hasClass("fa-square-o")) {
                    TSCORE.selectedFiles = [];   
                    $(self.viewContainer).find('.fileTileSelector').each(function(){
                        $(this).parent().parent().addClass("ui-selected");
                        $(this).find("i").addClass("fa-check-square").removeClass("fa-square-o");
                        TSCORE.selectedFiles.push($(this).attr("filepath"));  
                    });
                } else {
                    TSCORE.PerspectiveManager.clearSelectedFiles();
                }    
                self.handleElementActivation();
                checkIcon.toggleClass("fa-check-square");                                     
                checkIcon.toggleClass("fa-square-o");                        
            });
            
        $("#"+this.extensionID+"CreateFileButton")
            .click(function() {
                TSCORE.showFileCreateDialog();
            });
                    
        $("#"+this.extensionID+"IncludeSubDirsButton")         
            .click(function() {
                TSCORE.IO.createDirectoryIndex(TSCORE.currentPath);
            });
        
        $("#"+this.extensionID+"TagButton")
            .click(function() {
                TSCORE.showAddTagsDialog();
            });
        
        $("#"+this.extensionID+"ShowTmbButton")    
            .click(function() {
                self.toggleThumbnails();
            });

        $("#"+this.extensionID+"IncreaseThumbsButton")
            .click(function() {
                self.switchThumbnailSize();
            })      
            .prop('disabled', true);
        
        // Init Tag Context Menus
        this.viewContainer.on("contextmenu click", ".tagButton", function () {
            TSCORE.hideAllDropDownMenus();
            self.selectFile($(this).attr("filepath"));            
            TSCORE.openTagMenu(this, $(this).attr("tag"), $(this).attr("filepath"));
            TSCORE.showContextMenu("#tagMenu", $(this));
            return false;
        });    
        
        this.initFileGroupingMenu();
        
        // Disable all buttons    
        this.viewToolbar.find(".btn").prop('disabled', true);
    };

    ExtUI.prototype.switchThumbnailSize = function() {
        this.currentTmbSize = this.currentTmbSize + 1;
        
        if(this.currentTmbSize >= TMB_SIZES.length) { this.currentTmbSize = 0; }
        
        $('.thumbImgTile').css({"max-width":TMB_SIZES[this.currentTmbSize], "max-height":TMB_SIZES[this.currentTmbSize] });     
    };
    
    ExtUI.prototype.enableThumbnails = function() {
        $("#"+this.extensionID+"IncreaseThumbsButton" ).prop('disabled', false);
        $("#"+this.extensionID+"Container .thumbImgTile").each(function() {
            $(this).attr('style', "");
            $(this).attr('src',$(this).attr('filepath'));
        });
        $('.thumbImgTile').css({"max-width":TMB_SIZES[this.currentTmbSize], "max-height":TMB_SIZES[this.currentTmbSize] });     
    };   
    
    ExtUI.prototype.disableThumbnails = function() {
        //this.currentTmbSize = 0;
        $("#"+this.extensionID+"IncreaseThumbsButton" ).prop('disabled', true);
        $("#"+this.extensionID+"Container .thumbImgTile").each(function() {
            $(this).attr('style', "width: 0px; height: 0px; border: 0px");
            $(this).attr('src',"");
        });
    };     
    
    ExtUI.prototype.refreshThumbnails = function() {
        if(this.thumbEnabled) {
            this.enableThumbnails();
        } else {
            this.disableThumbnails();
        }
    };       
    
    ExtUI.prototype.toggleThumbnails = function() {
        this.thumbEnabled = !this.thumbEnabled;
        this.refreshThumbnails();
    };       

    ExtUI.prototype.switchGrouping = function(grouping) {
        this.currentGrouping = grouping;
        //TSCORE.startTime = new Date().getTime(); 
        this.reInit();
    };

    ExtUI.prototype.calculateGroupTitle = function(rawSource) {    
        var groupingTitle = "No Grouping";
        var self = this;
        var tmpDate;
        switch (this.currentGrouping){
            case "day": {
                tmpDate = new Date(rawSource[TSCORE.fileListFILELMDT]);
                tmpDate.setHours(0,0,0,0);
                groupingTitle = TSCORE.TagUtils.formatDateTime(tmpDate, false);                
                break;                
            }
            case "month": {
                tmpDate = new Date(rawSource[TSCORE.fileListFILELMDT]);
                tmpDate.setHours(0,0,0,0);
                tmpDate.setDate(1);
                groupingTitle = MONTH[tmpDate.getMonth()] +", "+tmpDate.getFullYear();                                
                break;                
            }
            case "year": {
                tmpDate = new Date(rawSource[TSCORE.fileListFILELMDT]);
                tmpDate.setHours(0,0,0,0);
                tmpDate.setDate(1);
                tmpDate.setMonth(1);
                groupingTitle = tmpDate.getFullYear();                                
                break;                
            }            
            default : {
                for (var i=0; i < TSCORE.Config.Settings.tagGroups.length; i++) {
                    if(TSCORE.Config.Settings.tagGroups[i].key === self.currentGrouping) {
                        var tagsInGroup = _.pluck(TSCORE.Config.Settings.tagGroups[i].children, "title");
                        var matchedTags = _.intersection(
                            rawSource[TSCORE.fileListTAGS],
                            tagsInGroup    
                            );
                        groupingTitle = "not grouped";
                        if(matchedTags.length > 0) {
                            groupingTitle = TSCORE.Config.Settings.tagGroups[i].title+" - "+matchedTags[0];
                        }
                        break;                        
                    }
                }                            
            }
        }
        return groupingTitle;
    };
        
    // Helper function for organizing the files in data buckets
    ExtUI.prototype.calculateGrouping = function(data) {
        var self = this;
        switch (this.currentGrouping){
            case "day": {
                data = _.groupBy( data, function(value){ 
                        var tmpDate = new Date(value[TSCORE.fileListFILELMDT]);    
                        tmpDate.setHours(0,0,0,0);
                        return tmpDate.getTime();
                    });                       
                break;                
            }
            case "month": {
                data = _.groupBy( data, function(value){ 
                        var tmpDate = new Date(value[TSCORE.fileListFILELMDT]);    
                        tmpDate.setHours(0,0,0,0);
                        tmpDate.setDate(1);
                        return tmpDate.getTime();
                    });
                break;                
            }
            case "year": {
                data = _.groupBy( data, function(value){ 
                        var tmpDate = new Date(value[TSCORE.fileListFILELMDT]);    
                        tmpDate.setHours(0,0,0,0);
                        tmpDate.setDate(1);
                        tmpDate.setMonth(1);
                        return tmpDate.getTime();
                    });
                break;                
            }            
            case "folder": {
                data = _.groupBy( data, function(value){ 
                        var folder = pathUtils.basename(pathUtils.dirname(value[TSCORE.fileListFILEPATH]))
                        return folder; 
                    });
                return data;
                // console.log(data);
                // return data;
                // break;
            }
            default : {
                var grouped = false;
                this.supportedGroupings.forEach(function(grouping) {
                    if(grouping.key === self.currentGrouping) {
                        data = _.groupBy( data, function(value) { 
                                var tagGroup = TSCORE.Config.getTagGroupData(grouping.key);
                                for (var i=0; i < tagGroup.children.length; i++) {
                                    for (var j=0; j < value[TSCORE.fileListTAGS].length; j++) {
                                        if (tagGroup.children[i].title === value[TSCORE.fileListTAGS][j]) {
                                            return tagGroup.children[i].title;
                                        }
                                    }
                                }
                            });
                        grouped = true;
                    }
                });                            
                if(!grouped) {
                    data = _.groupBy( data, function() {
                              return true;
                    });                    
                }
                break;                            
            }
        }
        // Sort groups by date
        data = _.sortBy(data, function(value) { 
                var tmpDate = new Date(value[0][TSCORE.fileListFILELMDT]);    
                return -tmpDate.getTime();            
            }); 
        
        return data;
    };

    ExtUI.prototype.reInit = function() {
        // Clear old data
        this.viewContainer.children().remove();
        this.viewFooter.children().remove();

        TSCORE.IO.createDirectoryIndex(TSCORE.currentPath, false);
        this.viewContainer.addClass("accordion");
        // $( this.extensionID+"IncludeSubDirsButton" ).prop('disabled', false); 
        
        var self = this;

        // Load new filtered data

        this.searchResults = TSCORE.Search.searchData(TSCORE.fileList, TSCORE.Search.nextQuery);
        var grouping = self.calculateGrouping(this.searchResults);
        console.log("s");
        console.log(grouping);
        var i = 0;
        _.each(grouping, function (value) { 
            i++;
            var groupingTitle = self.calculateGroupTitle(value[0]);
            
            self.viewContainer.append($("<div>", { 
                "class": "accordion-group disableTextSelection",    
                "style": "width: 100%; border: 0px #aaa solid;"
            })
            .append($("<div>", { 
                "class":  "accordion-heading  btn-group",
                "style":  "width:100%; margin: 0px; border-bottom: solid 1px #eee; background-color: #ddd;"
            })
            
            .append($("<button>", { // Grouped content toggle button
                        "class":        "btn btn-link groupTitle",
                        "data-toggle":  "collapse",
                        "data-target":  "#"+self.extensionID+"sortingButtons"+i,
                        "title":        "Toggle Group"
                    }  
                )
                .html("<i class='fa fa-minus-square' /i>&nbsp;")
                .click(function() {
                    $(this).find('i').toggleClass("fa-minus-square").toggleClass("fa-plus-square");
                })   
            )// End date toggle button  
                                    
            .append($("<span>", {
                "class":        "btn btn-link groupTitle",
               // "data-toggle":  "collapse",
               // "data-target":  "#"+self.extensionID+"sortingButtons"+i,                
                "style":        "margin-left: 0px; padding-left: 0px;",
                "text":         groupingTitle
                })  
            )
            
            ) // end heading
            
            .append($("<div>", { 
                "class":   "accordion-body collapse in",
                "id":      self.extensionID+"sortingButtons"+i,
                "style":   "margin: 0px 0px 0px 3px; border: 0px;"
            })          
            .append($("<div>", { 
                "class":   "accordion-inner",
                "id":      self.extensionID+"sortingButtonsContent"+i,
                "style":   "padding: 2px; border: 0px;"
            })
            ) // end accordion-inner    
            ) // end accordion button        

            ); // end group

            var groupedContent = $("<ol>", {
                style: "overflow: visible;",
                class: "selectableFiles"
            }).appendTo( "#"+self.extensionID+"sortingButtonsContent"+i ); 
            
            // Sort the files in group by name
            // value = _.sortBy(value, function(entry) { 
            //         return entry[TSCORE.fileListFILENAME];
            //     });                                         

            value = _.sortBy(value, function(entry) { 
                                var filePath = pathUtils.dirname(entry[0][TSCORE.fileListFILEPATH]);
                                var folder = pathUtils.basename(filePath);
                                return folder;
                            });             
            console.log('group');
            console.log(value);

            // Iterating over the files in group 
            for(var j=0; j < value.length; j++) {
                groupedContent.append(self.createFolderTile(value[j]));
            } 
            $('.hiddenpath').hide(); 
            $(".area" ).sortable({
                    connectWith: ".area",
                    handle: ".portlet-header",
                    cancel: ".portlet-toggle",
                    start: function (event, ui) {
                        ui.item.addClass('tilt');
                        tilt_direction(ui.item);
                    },
                    stop: function (event, ui) {
                        ui.item.removeClass("tilt");
                        $("html").unbind('mousemove', ui.item.data("move_handler"));
                        ui.item.removeData("move_handler");
                        // console.log(event.target.lastElementChild.textContent);
                    },
                    receive: function (event, ui) {
                        var source = event.toElement.lastElementChild.textContent;
                        var destination = event.target.nextElementSibling.textContent;
                        destination = pathUtils.join(destination, pathUtils.basename(source));
                        TSCORE.IO.renameFile(source, destination);
                    }
                });  
        
            $( ".portlet" )
                .addClass( "ui-widget ui-widget-content ui-helper-clearfix ui-corner-all" )
                .find( ".portlet-header" )
                .addClass( "ui-widget-header ui-corner-all" )
                .prepend( "<span class='ui-icon ui-icon-minusthick portlet-toggle'></span>");  
            // Adding event listeners
            groupedContent.find(".fileTile").each(function() {
                self.assignFileTileHandlers($(this));
            });
            
            // Disabling the file tile selection
            /* $( "#"+self.extensionID+"sortingButtonsContent"+i ).selectable({
                start: function() {
                    TSCORE.PerspectiveManager.clearSelectedFiles();   
                },                
                stop: function() {
                    TSCORE.selectedFiles = [];          
                    $( ".ui-selected", this ).each(function() {
                        TSCORE.selectedFiles.push($(this).attr("filepath"));
                    });
                    console.log("Selected files: "+TSCORE.selectedFiles);
                    self.handleElementActivation();
                }
            });  */          
        });  

        // Enable all buttons    
        this.viewToolbar.find(".btn").prop('disabled', false);
        // Disable certain buttons again    
        $("#"+this.extensionID+"IncreaseThumbsButton" ).prop('disabled', true);
        $("#"+this.extensionID+"TagButton" ).prop('disabled', true);
                 
        this.refreshThumbnails();

        if(this.searchResults.length !== undefined) {
             if(TSCORE.Search.nextQuery.length > 0) {
                $("#statusBar").text(this.searchResults.length+" files found for '"+TSCORE.Search.nextQuery+"'");                     
            } else {
                $("#statusBar").text(this.searchResults.length+" files found");                         
            }                
        }
        
        TSCORE.hideLoadingAnimation();          
    };

    ExtUI.prototype.assignFileTileHandlers = function($fileTile) {

        var filePath = $fileTile.attr("filepath");
        var self = this;

        $fileTile
         //.dblclick(function() {
         //   TSCORE.FileOpener.openFile(filePath);
         //   self.selectFile(filePath); 
         //})
         .hammer().on("doubletap", function() {
            TSCORE.FileOpener.openFile(filePath);
            self.selectFile(filePath); 
         })                 
         .click(function() {
            self.selectFile(filePath); 
         })
        .draggable({
            "cancel":    false,
            "appendTo":  "body",
            "helper":    "clone",
            "opacity":   "0.5",
            "revert":    true,
            "start":     function() {
                self.selectFile(filePath); 
            }            
        })                 
        .droppable({
            accept: ".tagButton",
            hoverClass: "activeRow",
            drop: function( event, ui ) {
                var tagName = TSCORE.selectedTag; //ui.draggable.attr("tag");                                   
                var targetFilePath = filePath;// $(this).attr("filepath");;

                // preventing self drag of tags
                var targetTags = TSCORE.TagUtils.extractTags(targetFilePath);
                for (var i = 0; i < targetTags.length; i++) {
                    if (targetTags[i] === tagName) {
                        return true;
                    }
                }
                
                console.log("Tagging file: "+tagName+" to "+targetFilePath);
                $(this).toggleClass("ui-selected");
                TSCORE.PerspectiveManager.clearSelectedFiles();
                TSCORE.selectedFiles.push(targetFilePath); 
                TSCORE.TagUtils.addTag(TSCORE.selectedFiles, [tagName]);
                self.handleElementActivation();
                
                //$(ui.helper).remove();  
            }                   
        })                
        .find(".fileTileSelector").click( function(e) {
            e.preventDefault();
            var $stateTag = $(this).find("i");
            if($stateTag.hasClass("fa-square-o")) {                    
                $stateTag.removeClass("fa-square-o").addClass("fa fa-check-square");
                $(this).parent().parent().addClass("ui-selected");
                TSCORE.selectedFiles.push(filePath);  
            } else {
                $stateTag.removeClass("fa-check-square").addClass("fa-square-o");                      
                $(this).parent().parent().removeClass("ui-selected");
                TSCORE.selectedFiles.splice(TSCORE.selectedFiles.indexOf(filePath), 1);
            }                  
            self.handleElementActivation();
            return false; 
        })                
        .find(".fileTagsTile").click( function() {
            self.selectFile($(this).attr("filepath"));
            TSCORE.openTagMenu(this, $(this).attr("tag"), $(this).attr("filepath"));
        })
    };
    
    
    ExtUI.prototype.clearSelectedFiles = function() {
        TSCORE.selectedFiles = [];   
        $("#"+this.extensionID+"Container").find(".ui-selected")
            .removeClass("ui-selected");
        $("#"+this.extensionID+"Container").find(".fileTileSelector").find("i")
            .removeClass("fa-check-square")
            .addClass("fa-square-o");   
        
        // Reseting select all button
        //$("#"+this.extensionID+"ToogleSelectAll").find("i").removeClass("fa-check-square").addClass("fa-square-o");   
    };
    
    ExtUI.prototype.selectFile = function(filePath) {
        TSCORE.PerspectiveManager.clearSelectedFiles();   
        $(this.viewContainer).find('.fileTileSelector').each(function(){
            if($(this).attr("filepath") === filePath) {
                $(this).parent().parent().toggleClass("ui-selected");
                $(this).find("i").toggleClass("fa-check-square").toggleClass("fa-square-o");
                TSCORE.selectedFiles.push($(this).attr("filepath"));                  
            }
        });
      
        TSCORE.selectedFiles.push(filePath);  
        this.handleElementActivation();      
    };     

    ExtUI.prototype.handleElementActivation = function() {
        console.log("Entering element activation handler...");
        
        var tagButton = $( "#"+this.extensionID+"TagButton" );
        
        if (TSCORE.selectedFiles.length > 1) {
            tagButton.prop('disabled', false);
        } else if (TSCORE.selectedFiles.length === 1) {
            tagButton.prop('disabled', false);
        } else {
            tagButton.prop('disabled', true);
        }    
    };

    ExtUI.prototype.removeFileUI = function(filePath) {
        console.log("Removing "+filePath+" from UI");

        if(isWin && !isWeb) {
            filePath = filePath.replace("\\","");
            $("#"+this.extensionID+"Container li[filepath]").each(function() {
                if( $( this ).attr("filepath").replace("\\","") === filePath ) {
                    $( this ).remove();
                }
            });            
        } else {
            $("#"+this.extensionID+"Container li[filepath='"+filePath+"']").remove();
        }  
    };
    
    ExtUI.prototype.updateFileUI = function(oldFilePath, newFilePath) {
        console.log("Updating file in UI");
        var title = TSCORE.TagUtils.extractTitle(newFilePath),
            fileExt = TSCORE.TagUtils.extractFileExtension(newFilePath),
            fileTags = TSCORE.TagUtils.extractTags(newFilePath);

        var $fileTile;
       
        if(isWin && !isWeb) {
            oldFilePath = oldFilePath.replace("\\","");
            $("#"+this.extensionID+"Container li[filepath]").each(function() {
                if( $( this ).attr("filepath").replace("\\","") === oldFilePath ) {
                    $fileTile = $( this );
                }
            });            
        } else {
            $fileTile = $("#"+this.extensionID+"Container li[filepath='"+oldFilePath+"']");
        }   

        $fileTile.replaceWith(this.createFolderTile(title, newFilePath, fileExt, fileTags));
        this.refreshThumbnails();
        this.assignFileTileHandlers($fileTile);

    };    
    
    ExtUI.prototype.getNextFile = function(filePath) {
        var nextFilePath;
        var self = this;
        this.searchResults.forEach(function(entry, index) {
            if(entry[TSCORE.fileListFILEPATH] === filePath) {
                var nextIndex = index+1;
                if(nextIndex < self.searchResults.length) {
                    nextFilePath = self.searchResults[nextIndex][TSCORE.fileListFILEPATH];                        
                } else {
                    nextFilePath = self.searchResults[0][TSCORE.fileListFILEPATH];
                }               
            }           
            //console.log("Path: "+entry[TSCORE.fileListFILEPATH]);
        });
        TSCORE.PerspectiveManager.clearSelectedFiles();     
        console.log("Next file: "+nextFilePath);
        return nextFilePath;         
    };
    
    ExtUI.prototype.getPrevFile = function(filePath) {    
        var prevFilePath;
        var self = this;
        this.searchResults.forEach(function(entry, index) {
            if(entry[TSCORE.fileListFILEPATH] === filePath) {
                var prevIndex = index-1;
                if(prevIndex >= 0) {
                    prevFilePath = self.searchResults[prevIndex][TSCORE.fileListFILEPATH];                        
                } else {
                    prevFilePath = self.searchResults[self.searchResults.length-1][TSCORE.fileListFILEPATH];
                }
            }           
            //console.log("Path: "+entry[TSCORE.fileListFILEPATH]);
        });
        TSCORE.PerspectiveManager.clearSelectedFiles();
        console.log("Prev file: "+prevFilePath);
        return prevFilePath;
    };    
    
    exports.ExtUI                   = ExtUI;

});