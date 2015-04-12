var devlog = angular.module('devLog', []);

devlog.directive('currentTime', ['$interval', 'dateFilter',
    function($interval, dateFilter) {

    return function(scope, element, attrs) {
      var format,  // date format
          stopTime; // so that we can cancel the time updates

      // used to update the UI
      function updateTime() {
        element.text(dateFilter(new Date(), format));
      }

      // watch the expression, and update the UI on change.
      scope.$watch(attrs.currentTime, function(value) {
        format = value;
        updateTime();
      });

      stopTime = $interval(updateTime, 1000);

      // listen on DOM destroy (removal) event, and cancel the next UI update
      // to prevent updating time after the DOM element was removed.
      element.on('$destroy', function() {
        $interval.cancel(stopTime);
      });
    };
}]);

devlog.controller('LogController', ['$scope', '$timeout', 'dbService', function($scope, $timeout, dbService) {
    $scope.format = 'M/d/yy hh:mm:ss a';
    $scope.logSelectedIndex = -1;
    $scope.tagSelectedIndex = -1;
    var currentSelectedTag = '';
    
    var self = this;
    
    this.getAllLogs = function() {
        return dbService.getAllLogs().then(function(logs) {
            $scope.logs = logs;

            if(logs.length === 0) {
                clearEditor();
            } else {
                logs = sortLogs(logs);
                displayLog(logs[0]);
            }
        });
    };
    
    this.getAllTags = function() {
        return dbService.getAllTags().then(function(tags) {
            tags = sortTags(tags);

            var index = tags.map(function(tag) { return tag.tag; }).indexOf('all');
            var allTag = tags[index];
            tags.splice(index, 1);

            // Move 'ALL' tag to the beginning.
            tags.unshift(allTag);
            $scope.tags = tags;
        });
    };
    
    this.addFn = function() {
        log = {
            'title': '',
            'content': '',
            'timestamp': (new Date()).getTime(),
            'is_removed': false,
            'tags': []
        };

        logs = $scope.logs;
        logs.push(log);
        $scope.logs = logs;
        clearEditor();

        if(currentSelectedTag !== ''  && currentSelectedTag !== 'all') {
            $scope.logTags = currentSelectedTag;
        }
    };
    
    this.clickTagFn = function($index, tagName) {
        currentSelectedTag = $scope.tags[$index].tag;

        $scope.tagSelectedIndex = $index;
        $scope.logSelectedIndex = 0;

        if(tagName === 'all') {
            self.getAllLogs();
        } else {
            dbService.getLogsWithTag(tagName).then(function(logs) {
                $scope.logs = logs;

                logs = sortLogs(logs);
                displayLog(logs[0]);
            });
        }
        
    };
    
    this.clickLogFn = function($index, log) {
        $scope.logSelectedIndex = $index;
        displayLog(log);
    };
    
    this.removeLogFn = function(key) {
        dbService.removeLogAndTag(key).then(function() {
            if(currentSelectedTag !== 'all') {
                $scope.tagSelectedIndex = findTagIndex($scope.tags, currentSelectedTag);

                dbService.getLogsWithTag(currentSelectedTag).then(function(logs) {
                    $scope.logs = logs;
                    
                    if(logs.length === 0) {
                        clearEditor();
                        $scope.tagSelectedIndex = 0;
                        self.getAllLogs();
                    } else {
                        logs = sortLogs(logs);
                        displayLog(logs[0]);
                    }
                });
            } else {
                $scope.tagSelectedIndex = 0;
                self.getAllLogs();
            }

            $scope.logSelectedIndex = 0;

            self.getAllTags();
        });
    };
    
    this.saveFn = function() {
        log = formLogDoc();
        
        // check if selectedTag is present
        // if removed select the first tag
        // in the log
        if(currentSelectedTag !== 'all' && log.tags.indexOf(currentSelectedTag) === -1) {
            currentSelectedTag = log.tags[0];
        }
        
        var logKey = $scope.logKey;
        if(logKey !== null && logKey !== undefined && logKey.trim() !== '') {
            log.key = logKey;
            dbService.updateLogAndTag(log).then(function() {
                save();
            });
        } else {
            dbService.insertLogAndTag(log).then(function() {
                save();
            });
        }
    };
    
    this.changedFn = function() {
        myTimer.clear();
        myTimer.set();
    };

    var myTimer = function() {
        var timer;
        this.set = function() {
            timer = $timeout(self.saveFn, 1000);
        };

        this.clear = function() {
            $timeout.cancel(timer);
        };

        return this;
    }();

    var save = function() {
        self.getAllTags();
        
        if(currentSelectedTag === '' || currentSelectedTag === 'all') {
            self.getAllLogs();

            $scope.logSelectedIndex = 0;

            $scope.tagSelectedIndex = findTagIndex($scope.tags, currentSelectedTag);
        } else {
            dbService.getLogsWithTag(currentSelectedTag).then(function(logs) {
                logs = sortLogs(logs);

                $scope.logs = logs;
                displayLog(logs[0]);
                $scope.logSelectedIndex = 0;

                $scope.tagSelectedIndex = findTagIndex($scope.tags, currentSelectedTag);
            });
        }
    };
    
    var findTagIndex = function(tags, value) {
        for(var i = 0; i < tags.length; i++) {
            if(tags[i].tag === value) {
                return i;
            }
        }
        
        return -1;
    };
    
    var displayLog = function(log) {
        var tags = '';

        for(i = 0; i < log.tags.length; i++) {
            tags += log.tags[i];
            if(i != log.tags.length - 1) {
                tags += ", ";
            }
        }
        $scope.logTags = tags;
        $scope.logTitle = log.title;
        $scope.logContent = log.content;
        $scope.logKey = log.key;
    };
    
    var clearEditor = function() {
        $scope.logTitle = '';
        $scope.logTags = '';
        $scope.logContent = '';
        $scope.logKey = '';
    };
    
    var formLogDoc = function() {
        var tags = $scope.logTags;
        
        if(tags === null || tags === undefined || tags.trim() === "") {
            formedTags = [];
        } else {
            tags = tags.trim().toLowerCase();
            var re = /\s*,\s*/;
            formedTags = tags.split(re);
        }

        log = {
            'title': $scope.logTitle,
            'content': $scope.logContent,
            'timestamp': (new Date()).getTime(),
            'is_removed': false,
            'tags': formedTags
        };
        return log;
    };
    
    /*
        Sorting logs in descending order based on timestamp.
    */
    var sortLogs = function(logs) {
        return logs.sort(function(a, b) {
            return parseFloat(b.timestamp) - parseFloat(a.timestamp);
        });
    };
    
    /*
        Sorting tags alphabetically.
    */
    var sortTags = function(tags) {
        return tags.sort(function(a, b) {
            var tagA = a.tag.toLowerCase();
            var tagB = b.tag.toLowerCase();
            if(tagA < tagB) {
                return -1;
            }
            if(tagA > tagB) {
                return 1;
            }
            return 0;
        });
    };
    
    /*
        Insert ALL tag when the app starts.
    */
    var insertAllTag = function() {
        var tag = {
            'tag': 'all'
        };
        
        return dbService.findTag('all').then(function(tags) {
            if(tags.length === 0) {
                return dbService.insertTag(tag);
            }
        });

    };
    
    /*
        Initialize the app. Display the latest log in 'ALL' tag.
        Selection: 'ALL' tag and latest log.
    
        Used only when the app starts.
    */
    var init = function() {
        insertAllTag().then(function() {
            self.getAllLogs().then(function() {
                $scope.logSelectedIndex = 0;
            });
            
            self.getAllTags().then(function() {
                $scope.tagSelectedIndex = 0;
                currentSelectedTag = $scope.tags[0].tag;
            });
        });
    };
    
    init();
}]);