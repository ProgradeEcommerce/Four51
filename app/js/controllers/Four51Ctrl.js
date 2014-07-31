four51.app.controller('Four51Ctrl', ['$scope', '$route', '$location', '$451', 'User', 'Order', 'Security', 'OrderConfig', 'Category', 'AppConst','Product','Variant','DocumentBuilder',
function ($scope, $route, $location, $451, User, Order, Security, OrderConfig, Category, AppConst, Product, Variant, DocumentBuilder) {
    $scope.AppConst = AppConst;
	$scope.scroll = 0;
	$scope.isAnon = $451.isAnon; //need to know this before we have access to the user object
	$scope.Four51User = Security;
	if ($451.isAnon && !Security.isAuthenticated()){
		User.login(function() {
			$route.reload();
		});
	}

    // fix Bootstrap fixed-top and fixed-bottom from jumping around on mobile input when virtual keyboard appears
    if ( $(window).width() < 960 ) {
        $(document)
        .on('focus', ':input:not("button")', function(e) {
            $('.navbar-fixed-bottom, .headroom.navbar-fixed-top').css("position", "relative");
        })
        .on('blur', ':input', function(e) {
            $('.navbar-fixed-bottom, .headroom.navbar-fixed-top').css("position", "fixed");
        });
    }

    function init() {
        if (Security.isAuthenticated()) {
            User.get(function(user) {
                $scope.user = user;

	            if (!$scope.user.TermsAccepted)
		            $location.path('conditions');

	            if (user.CurrentOrderID) {
                    Order.get(user.CurrentOrderID, function(ordr) {
                        $scope.currentOrder = ordr;
			            OrderConfig.costcenter(ordr, user);
                    });
                }
                else {
                    $scope.currentOrder = null;
                }

                /*$scope.DocumentList = [];
                $scope.MasterProduct = {};
                $scope.MasterProduct.VariantList = [];
                $scope.MasterProduct.CollectionList = [];
                $scope.MasterProduct.InactiveCollectionList = [];
                $scope.MasterProduct.CollectionIDs = [];
                $scope.MasterProduct.CollectionDocuments = [];*/
                $scope.buildCollectionLists = function() {
                    $scope.LoadingDocuments = true;
                    $scope.loadingCollectionList = true;
                    Product.get('MASTER', function(product) {
                        if ($scope.MasterProduct) {
                            $scope.LoadingDocuments = false;
                            $scope.loadingCollectionList = false;
                            return;
                        }
                        $scope.MasterProduct = product;

                        $scope.documentLoadingIndicator = true;
                        $scope.DocumentList = [];
                        //var twoPageDocs = [];
                        Product.search("0000", null, null, function(documents) {
                            $scope.FavoriteDocumentsEnabled = false;
                            angular.forEach($scope.user.CustomFields, function(field){
                                if (field.Name == "FavoriteDocuments") {
                                    $scope.FavoriteDocumentsEnabled = true;
                                    $scope.FavoriteDocuments = [];
                                    if (field.Value) {
                                        $scope.FavoriteDocuments = field.Value.split("||");
                                    }
                                }
                            });
                            angular.forEach(documents, function(doc) {
                                doc.Type = "document";
                                if ($scope.FavoriteDocumentsEnabled) {
                                    doc.Favorite = $scope.FavoriteDocuments.indexOf(doc.ExternalID) > -1;
                                }
                                else {
                                    doc.Favorite = false;
                                }
                            });
                            $scope.DocumentList = documents;
                            $scope.DocumentNames = {};
                            angular.forEach($scope.DocumentList, function(doc) {
                                $scope.DocumentNames[doc.ExternalID] = doc;
                            });
                            $scope.loadingCollectionList = true;
                            DocumentBuilder.buildCollectionLists($scope.MasterProduct,$scope.DocumentNames, function(variantList, collectionList, inactiveCollectionList, collectionIDs, collectionDocuments) {
                                $scope.MasterProduct.VariantList = variantList;
                                $scope.MasterProduct.CollectionList = collectionList;
                                $scope.MasterProduct.InactiveCollectionList = inactiveCollectionList;
                                $scope.MasterProduct.CollectionIDs = collectionIDs;
                                $scope.MasterProduct.CollectionDocuments = collectionDocuments;
                                $scope.$broadcast('event:DocumentListLoaded');
                                $scope.loadingCollectionList = false;
                            });
                            DocumentBuilder.buildFilters($scope.DocumentList);
                            $scope.documentLoadingIndicator = false;

                            angular.forEach($scope.DocumentList, function(document){
                                document.Selected = false;
                                angular.forEach($scope.Collection.SelectedDocuments, function(doc) {
                                    if (document.InteropID == doc.InteropID) {
                                        document.Selected = true;
                                    }
                                    if ($scope.FavoriteDocuments && $scope.FavoriteDocuments.indexOf(doc.ExternalID) > -1) {
                                        document.Favorite = true;
                                    }
                                });
                                //document.twoPager = false;
                                //document.genre = 'document';
                                //document.displayDividerButton = true;
                                //if(twoPageDocs.indexOf(product.InteropID) > -1){
                                //document.twoPager = true;
                                //}
                            });
                            $scope.LoadingDocuments = false;
                        }, 1, 100);

                        Product.search("EXTRA", null, null, function(documents) {
                            $scope.ExtraDocuments = {};
                            angular.forEach(documents, function(document) {
                                $scope.ExtraDocuments[document.InteropID] = document;
                            });
                            $scope.$broadcast('event:ExtraDocumentsLoaded');
                        }, 1, 100);
                    });
                };

                $scope.buildCollectionLists();

                //Initialize Collection
                $scope.Collection = store.get('451Cache.Collection') ? store.get('451Cache.Collection') : {"SelectedDocuments":[],"CoverLetter":{"Editing":false}};
            });

//            Category.get("PRODUCTS", function(data){
//                $scope.tree = {SubCategories: data};
//                $scope.$broadcast("treeComplete", data);
//            });
            Category.tree(function(data) {
                $scope.tree = [];
                angular.forEach(data, function(category) {
                    if (['MASTER','0000','EXTRA'].indexOf(category.InteropID) < 0) {
                        $scope.tree.push(category);
                    }
                });
			    $scope.$broadcast("treeComplete", data);
	        });
        }
    }

	function analytics(id) {
		if (id.length == 0) return;
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

		ga('create', id, 'four51.com');
		ga('require', 'ecommerce', 'ecommerce.js');
	}

	/*trackJs.configure({
		trackAjaxFail: false
	});*/

    $scope.errorSection = '';

    function cleanup() {
        Security.clear();
    }

    $scope.$on('event:auth-loginConfirmed', function(){
        $route.reload();
	    User.get(function(user) {
		    analytics(user.Company.GoogleAnalyticsCode);
	    });
	});
	$scope.$on("$routeChangeSuccess", init);
    $scope.$on('event:auth-loginRequired', cleanup);
}]);