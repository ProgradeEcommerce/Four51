//TODO watch //github.com/angular-ui/ui-utils/issues/106 to see when it gets pulled into angular-ui
four51.app.directive('hoverIntent',['$timeout',
    function($timeout) {
    var obj = {
        restrict: 'A',
        link: function(scope, element, attributes){
            var hoverIntentPromise;
            element.bind('mouseenter', function(event){
                var delay = scope.$eval(attributes.hoverIntentDelay);
                if(delay === undefined){
                    delay = 500;
                }

                hoverIntentPromise = $timeout(function(){
                    scope.$eval(attributes.hoverIntent, { $event: event });
                }, delay);
            });
            element.bind('mouseleave', function(){
                $timeout.cancel(hoverIntentPromise);
            });
        }
    };
    return obj;
}]);

