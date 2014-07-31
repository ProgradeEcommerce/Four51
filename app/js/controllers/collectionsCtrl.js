four51.app.controller('CollectionsCtrl', ['$scope','$location','User','DocumentBuilder','Variant', 'Order',
function ($scope, $location, User, DocumentBuilder, Variant, Order) {

    $scope.selectedCollection = [];
    $scope.selectCollection = function(c){
        $scope.selectedCollection = c;
    };

    $scope.newCollection = function() {
        $scope.Collection = {"SelectedDocuments":[],"CoverLetter":{"Editing":false},"Editing":false};
        DocumentBuilder.resetDocList($scope.DocumentList);
        DocumentBuilder.buildCollectionSpecs($scope.Collection,$scope.DocumentList,$scope.MasterProduct);
        DocumentBuilder.buildCoverLetterSpecs($scope.Collection,$scope.ExtraDocuments,$scope.MasterProduct);
        store.set("451Cache.Collection",{});
        store.set("451Cache.Collection",$scope.Collection);
        $location.path('builder');
    };

    $scope.editCollection = function(collection) {
        $scope.Collection = {"SelectedDocuments":[],"CoverLetter":{"Editing":false},"Specs":{},"Editing":true};
        DocumentBuilder.buildCopy($scope.Collection,collection,$scope.DocumentList,$scope.MasterProduct, $scope.ExtraDocuments);
        store.set("451Cache.Collection",{});
        store.set("451Cache.Collection",$scope.Collection);
        $location.path('builder');
    };

    $scope.deleteCollection = function(collection) {
        var r = confirm("Are you sure you wish to delete " + collection.ExternalID + "?");
        if (r) {
            collection.Specs['Active'].Value = "false";
            Variant.save(collection, function(v) {
                $scope.buildCollectionLists();
            });
        }
    };

    $scope.downloadPDF = function(collection) {
        window.location.href = collection.ProductionURL.replace('web.four51.com','.four51.com');;
    };

    function addToOrder(order,collection) {
        var li = {
            "LineTotal":$scope.MasterProduct.StandardPriceSchedule.PriceBreaks[0].Price ,
            "PriceSchedule":$scope.MasterProduct.StandardPriceSchedule,
            "Product": $scope.MasterProduct,
            "Quantity":1,
            "Specs":{},
            "UnitPrice":$scope.MasterProduct.StandardPriceSchedule.PriceBreaks[0].Price,
            "qtyError":null,
            "Variant":collection
        };

        order.LineItems.push(li);

        Order.save(order,
            function(o) {
                $scope.user.CurrentOrderID = o.ID;
                User.save($scope.user, function(){
                    $location.path('/cart');
                });
            },
            function(ex) {
                console.log(ex);
            }
        );
    }

    $scope.orderCollection = function(collection) {
        User.get(function(user) {
            if (user.CurrentOrderID != null) {
                Order.get(user.CurrentOrderID, function(order) {
                    var inOrder = false;
                    angular.forEach(order.LineItems, function(li) {
                        if (li.Variant && li.Variant.InteropID == collection.InteropID) {
                            inOrder = true;
                        }
                    });
                    if (inOrder) {
                        var r = confirm("This collection is already in your cart. Would you like to order another copy?");
                        if (r) {
                            addToOrder(order,collection);
                        }
                    }
                    else {
                        addToOrder(order,collection);
                    }
                });
            }
            else {
                var order = {};
                order.LineItems = [];
                addToOrder(order,collection);
            }
        });
    };

    $scope.sortBy = "ExternalID";
    $scope.reverse = false;
    $scope.updateSortBy = function(option) {
        if ($scope.sortBy == option) {
            $scope.reverse = !$scope.reverse;
        }
        else {
            $scope.sortBy = option;
            $scope.reverse = false;
        }
    }
}]);