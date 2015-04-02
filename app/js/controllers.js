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

devlog.controller('LogController', ['$scope', 'dbService', function($scope, dbService) {
    $scope.format = 'M/d/yy hh:mm:ss a';
    
    var self = this;
    
    this.getAllLogs = function() {
        dbService.getAllLogs().then(function(logs) {
            $scope.logs = logs;
        });
    };
    
    this.getAllTags = function() {
        dbService.getAllTags().then(function(tags) {
            tags.push({
                'tag': 'all'
            });
            $scope.tags = tags;
        });
    };
    
    this.clickLogFn = function(key) {
        dbService.getLog(key).then(function(log) {
            var tags = '';

            for(i = 0; i < log.tags.length; i++) {
                tags += log.tags[i];
                if(i != log.tags.length - 1) {
                    tags += ",";
                }
            }
            $scope.logTags = tags;
            $scope.logTitle = log.title;
            $scope.logContent = log.content;
        });
    };
    
    this.removeLogFn = function(key) {
        dbService.removeLogAndTag(key).then(function() {
            init();
        });
    };
    
    this.savefn = function() {
        log = formLogDoc();
        
        dbService.insertLogAndTag(log).then(function() {
            init();
            clearEditor();
        });
    };
    
    this.clickTagFn = function(tagName) {
        if(tagName === 'all') {
            dbService.getAllLogs().then(function(logs) {
                $scope.logs = logs;
            });
        } else {
            dbService.getLogsWithTag(tagName).then(function(logs) {
                $scope.logs = logs;
            });
        }
        
    };
    
    var init = function() {
        self.getAllLogs();
        self.getAllTags();
    };
    
    init();
    
    var formLogDoc = function() {
        var tags = $scope.logTags;
        
        if(tags === null || tags === undefined || tags.trim() === "") {
            formedTags = [];
        } else {
            tags = tags.trim().toLowerCase();
            formedTags = tags.split(',');
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
    
    var clearEditor = function() {
        $scope.logTitle = '';
        $scope.logTags = '';
        $scope.logContent = '';
    };
}]);