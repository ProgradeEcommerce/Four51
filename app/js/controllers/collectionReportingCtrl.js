four51.app.controller('CollectionReportingCtrl', ['$scope','$location','User','DocumentBuilder','Variant',
    function ($scope, $location, User, DocumentBuilder, Variant) {

        function saveCollection(collection) {
            $scope.adminLoadingIndicator = true;
            Variant.save(collection, function(v) {
                $scope.buildCollectionLists();
                $scope.adminLoadingIndicator = false;
            });
        }

        $scope.downloadPDF = function(collection) {
            window.location.href = collection.ProductionURL.replace('web.four51.com','.four51.com');;
        };

        $scope.pseudoDeleteCollection = function(collection) {
            collection.Specs['Active'].Value = "false";
            saveCollection(collection);
        };

        $scope.refreshCollection = function(collection) {
            saveCollection(collection);
        };

        $scope.activateCollection = function(collection) {
            collection.Specs['Active'].Value = "true";
            saveCollection(collection);
        };

        $scope.deleteCollection = function(collection) {
            var cDelete = {
                "InteropID":collection.InteropID,
                "ProductInteropID":collection.ProductInteropID
            };
            Variant.delete(cDelete,
                function() {
                    $scope.buildCollectionLists();
                },
                function(ex) {
                    console.log(ex);
                }
            );
        };

    }]);