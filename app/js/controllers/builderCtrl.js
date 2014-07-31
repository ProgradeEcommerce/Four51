four51.app.controller('BuilderCtrl', ['$scope','$location','User','DocumentBuilder','Variant','Order',
function ($scope, $location, User, DocumentBuilder, Variant, Order) {

    $scope.VariablesStore = {'mobileView':'0'};

    if (window.innerWidth < 991) {
        $scope.VariablesStore.isMobile = true;
    } else {
        $scope.VariablesStore.isMobile = false;
    }

    function randomString() {
        var chars = "0123456789abcdefghijklmnop";
        var string_length = 7;
        var randomstring = '';
        for (var i=0; i<string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum,rnum+1);
        }
        return randomstring;
    }

    $scope.$on('event:DocumentListLoaded', function() {
        angular.forEach($scope.Collection.SelectedDocuments, function(document) {
            for (var i = 0; i < $scope.DocumentList.length; i++) {
                if (document.InteropID == $scope.DocumentList[i].InteropID) {
                    document.Index = i;
                    $scope.DocumentList.splice(i,1);
                }
            }
        });
    });

    $scope.cancelCollection = function() {
        $scope.Collection = {"SelectedDocuments":[],"CoverLetter":{"Editing":false}};
        store.set('451Cache.Collection',{});
        store.set('451Cache.Collection',$scope.Collection);
        $location.path('proposals');
    };

    $scope.cacheCollection = function() {
        store.set('451Cache.Collection',{});
        store.set('451Cache.Collection',$scope.Collection);
    };

    //Initialize and Select/Deselect Filters
    $scope.selectedCategories = [];
    $scope.filterSelect = function(category) {
        if ($scope.selectedCategories.indexOf(category) == -1) {
            $scope.selectedCategories.push(category);
        }
        else {
            for (var i = 0; i <  $scope.selectedCategories.length; i++) {
                if ($scope.selectedCategories[i] == category) {
                    $scope.selectedCategories.splice(i,1);
                }
            }
        }
    };
    $scope.favoriteDocs = false;
    $scope.updateFavoriteDocFilter = function() {
        $scope.favoriteDocs = !$scope.favoriteDocs;
    };

    $scope.clearFilters = function() {
        $scope.VariablesStore.fromdate = '';
        $scope.VariablesStore.todate = '';
        $scope.VariablesStore.keyword = '';
        $scope.selectedCategories = [];
    };

    function analyzeDividers() {
        var dividerCount = 0;
        for (var i = 0; i < $scope.Collection.SelectedDocuments.length; i++) {
            if (i > 0) {
                $scope.Collection.SelectedDocuments[i].ShowDividerBtn = $scope.Collection.SelectedDocuments[i - 1].Type != 'divider';
            }
            else {
                $scope.Collection.SelectedDocuments[i].ShowDividerBtn = $scope.Collection.SelectedDocuments[i].Type == 'document';
            }
            $scope.Collection.SelectedDocuments[i].ShowDividerBtn = $scope.Collection.SelectedDocuments[i].Type == 'divider' ? false : $scope.Collection.SelectedDocuments[i].ShowDividerBtn;

            if ($scope.Collection.SelectedDocuments[i].Type == 'divider') {
                dividerCount++;
            }

            if ($scope.Collection.SelectedDocuments[i].Type == 'divider' && ($scope.Collection.SelectedDocuments[i+1] && $scope.Collection.SelectedDocuments[i+1].Type == 'divider')) {
                $scope.Collection.SelectedDocuments.splice(i+1,1);
                dividerCount--;
                i++;
            }
        }
        if ($scope.Collection.SelectedDocuments.length > 0 && $scope.Collection.SelectedDocuments[$scope.Collection.SelectedDocuments.length - 1].Type == 'divider') {
            $scope.Collection.SelectedDocuments.splice($scope.Collection.SelectedDocuments.length - 1,1);
        }
        if (dividerCount == 5) {
            angular.forEach($scope.Collection.SelectedDocuments, function(doc) {
                doc.ShowDividerBtn = false;
            });
        }
        $scope.cacheCollection();
    }

    //Update selected documents in Collection
    ////   TURN INTO SERVICE FUNCTIONS  ////
    $scope.updateCollection = function(document) {
        if (document.Selected) {
            document.Selected = false;
            for (var i = 0; i < $scope.Collection.SelectedDocuments.length; i++) {
                if ($scope.Collection.SelectedDocuments[i].InteropID == document.InteropID) {
                    $scope.Collection.SelectedDocuments[i].Preview = false;
                    $scope.Collection.SelectedDocuments.splice(i,1);
                    if (document.Type == 'document') {
                        $scope.DocumentList.splice(document.Index, 0, document);
                    }
                }
            }
            for (var j = 0; j < $scope.DocumentList.length; j++) {
                if ($scope.DocumentList[j].InteropID == document.InteropID) {
                    $scope.DocumentList[j].Selected = false;
                }
            }
        }
        else {
            if (document.Specs && !document.Editing) {
                this.Preview = false;
                document.Editing = true;
            }
            else {
                document.Selected = true;
                document.Editing = false;
                document.Preview = false;
                for (var i = 0; i < $scope.DocumentList.length; i++) {
                    if ($scope.DocumentList[i].InteropID == document.InteropID) {
                        $scope.DocumentList.splice(i,1);
                        document.Index = i;
                    }
                }
                document.ShowDividerBtn = true;
                $scope.Collection.SelectedDocuments.push(document);
            }
        }
        analyzeDividers();
        $scope.cacheCollection();
    };

    $scope.editSpecs = function(document) {
        $scope.Collection.Specs = store.get('451Cache.Collection').Specs;
        document.Editing = true;
    };

    $scope.cancelEditSpecs = function(document){
        $scope.Collection = store.get('451Cache.Collection');
        document.Editing = false;
        angular.forEach($scope.Collection.SelectedDocuments, function(doc) {
            doc.Editing = false;
        });
    };

    $scope.$watch('Collection.SelectedDocuments', function(){
        analyzeDividers();
    },true);

    $scope.sortableOptions = {
        update: function(e, ui) {
            var invalid = false;

            if (ui.item.scope().document.Type == 'divider') {
                var dropIndex = ui.item.sortable.dropindex;
                if (dropIndex > 0) {
                    invalid = (($scope.Collection.SelectedDocuments[dropIndex-1].Type == 'divider' && $scope.Collection.SelectedDocuments[dropIndex-1].InteropID != ui.item.scope().document.InteropID) || $scope.Collection.SelectedDocuments[dropIndex].Type == 'divider');
                }
                else {
                    invalid = ($scope.Collection.SelectedDocuments[dropIndex].Type == 'divider');
                }

                if (dropIndex == ($scope.Collection.SelectedDocuments.length - 1)) {
                    invalid = true;
                }
            }

            if (invalid) {
                ui.item.sortable.cancel();
            }
            else {
                analyzeDividers();
            }
        },
        axis: 'y'
    };

    $scope.$watch('Collection.SelectedDocuments', function(){
        $scope.cacheCollection();
    },true);

    //DocumentBuilder.buildCollectionSpecs($scope.Collection,$scope.DocumentList,$scope.MasterProduct);
    //DocumentBuilder.buildCoverLetterSpecs($scope.Collection,$scope.ExtraDocuments,$scope.MasterProduct);
    $scope.cacheCollection();

    $scope.removeCoverLetter = function() {
        $scope.Collection.CoverLetter.Editing = false;
        $scope.Collection.CoverLetter.Title = "";
        angular.forEach($scope.Collection.CoverLetter.Specs, function(spec) {
            spec.Value = "";
        });
        $scope.cacheCollection();
    };

    $scope.saveCoverLetter = function() {
        $scope.Collection.CoverLetter.Editing = false;
        $scope.Collection.CoverLetter.SpecValueCount = 0;
        angular.forEach($scope.Collection.CoverLetter.Specs, function(value, key) {
            if (value.Value) {
                $scope.Collection.CoverLetter.SpecValueCount++;
            }
        });
        $scope.cacheCollection();
    };

    $scope.cancelCoverLetter = function() {
        $scope.Collection = store.get('451Cache.Collection');
        $scope.Collection.CoverLetter.Editing = false;
        $scope.cacheCollection();
    };

    function saveUserFavoriteDocs(user) {
        var favDocIndex = 0;
        for (var i = 0; i < $scope.user.CustomFields.length; i++) {
            if ($scope.user.CustomFields[i].Name == "FavoriteDocuments") {
                favDocIndex = i;
            }
        }
        var favoriteDocs = "";
        angular.forEach($scope.FavoriteDocuments, function(doc) {
            if (doc != "") {
                favoriteDocs += doc + "||";
            }
        });
        favoriteDocs = favoriteDocs.substr(0,favoriteDocs.length-2)
        $scope.user.CustomFields[favDocIndex].Value = favoriteDocs;

        User.save($scope.user, function(user) {
            $scope.user = user;
        });
    }

    $scope.updateFavoriteDocuments = function(document) {
        if ($scope.FavoriteDocuments.indexOf(document.ExternalID) == -1) {
            document.Favorite = true;
            $scope.FavoriteDocuments.push(document.ExternalID);
            saveUserFavoriteDocs($scope.user);
        }
        else {
            document.Favorite = false;
            for (var i = 0; i < $scope.FavoriteDocuments.length; i++) {
                if ($scope.FavoriteDocuments[i] == document.ExternalID) {
                    $scope.FavoriteDocuments.splice(i,1);
                }
                saveUserFavoriteDocs($scope.user);
            }
        }
        if ($scope.FavoriteDocuments.length == 0) {
            $scope.favoriteDocs = false;
        }
    };

    $scope.generateCollection = function() {
        $scope.GeneratingCollection = true;
        var collection = {};
        if (!$scope.Collection.Specs) {
            DocumentBuilder.buildCollectionSpecs($scope.Collection,$scope.DocumentList,$scope.MasterProduct);
        }
        collection = $scope.Collection;

        var variant = {
            "ProductInteropID": $scope.MasterProduct.InteropID,
            "Specs":{},
            "InteropID": collection.InteropID
        };

        variant.Specs = collection.Specs;
        variant.Specs['Active'] = {};
        variant.Specs['Active'].Value = "true";
        variant.Specs['Collection'] = {};
        variant.Specs['Collection'].Value = "true";
        variant.Specs['SaveAs'] = {};
        variant.Specs['SaveAs'].Value = collection.Title;
        variant.Specs['DateLastUpdated'] = {};
        variant.Specs['DateLastUpdated'].Value = new Date().getTime();
        variant.Specs['CreatedBy'] = {};
        variant.Specs['CreatedBy'].Value = $scope.user.FirstName + " " + $scope.user.LastName;
        /*variant.Specs['Name'] = {};
        variant.Specs['Name'].Value = $scope.user.FirstName + " " + $scope.user.LastName;*/

        for (var spec in $scope.MasterProduct.Specs) {
            if (spec.indexOf('Page') == 0) {
                variant.Specs[spec] = {};
                variant.Specs[spec].Value = "";
            }
        }

        var dividerIndex = 1;
        var pageIndex = 1;
        if (collection.CoverLetter.Title) {
            variant.Specs['Page' + pageIndex] = {};
            variant.Specs['Page' + pageIndex].Value = "CL01";
            variant.Specs['CoverLetterTitle'] = {};
            variant.Specs['CoverLetterTitle'].Value = collection.CoverLetter.Title;
            angular.forEach(collection.CoverLetter.Specs, function(spec) {
                variant.Specs[spec.Name] = spec;
            });
            pageIndex++;
        }

        angular.forEach(collection.SelectedDocuments, function(document) {
            variant.Specs['Page' + pageIndex] = {};
            if (document.Type == 'document') {
                variant.Specs['Page' + pageIndex].Value = document.InteropID;
            }
            else {
                variant.Specs['Page' + pageIndex].Value ="Div" + dividerIndex;
                variant.Specs['DividerHeadline' + dividerIndex] = {};
                variant.Specs['DividerHeadline' + dividerIndex].Value = document.Headline;
                dividerIndex++;
            }
            pageIndex++;
        });

        Variant.save(variant, function(data) {
            $scope.Collection = {"SelectedDocuments":[],"CoverLetter":{"Editing":false}};
            $scope.MasterProduct.Variants.push(data);
            DocumentBuilder.buildCollectionLists($scope.MasterProduct,$scope.DocumentNames, function(variantList, collectionList, inactiveCollectionList, collectionIDs, collectionDocuments) {
                $scope.MasterProduct.VariantList = variantList;
                $scope.MasterProduct.CollectionList = collectionList;
                $scope.MasterProduct.InactiveCollectionList = inactiveCollectionList;
                $scope.MasterProduct.CollectionIDs = collectionIDs;
                $scope.MasterProduct.CollectionDocuments = collectionDocuments;
            });
            $scope.cacheCollection();
            if (collection.LineItemID) {
                Order.get($scope.user.CurrentOrderID, function(order) {
                    angular.forEach(order.LineItems, function(li) {
                        if (li.ID == collection.LineItemID) {
                            li.Variant = data;
                        }
                    });
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
                });
            }
            else {
                $scope.GeneratingCollection = false;
                $location.path('proposals');
            }
        },
        function(ex) {
            console.log(ex);
        });

    };

    function addToOrder(order) {
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
    };

    $scope.addIndDocToOrder = function(document) {
        var variant = {
            "ProductInteropID": $scope.MasterProduct.InteropID,
            "Specs":{}
        };

        variant.Specs = $scope.Collection.Specs;
        variant.Specs['Collection'] = {};
        variant.Specs['Collection'].Value = "false";
        variant.Specs['SaveAs'] = {};
        variant.Specs['SaveAs'].Value = document.Name;
        variant.Specs['DateLastUpdated'] = {};
        variant.Specs['DateLastUpdated'].Value = new Date().getTime();
        variant.Specs['Page1'] = {};
        variant.Specs['Page1'].Value = document.InteropID;

        Variant.save(variant, function(data) {
                var li = {
                    "LineTotal":$scope.MasterProduct.StandardPriceSchedule.PriceBreaks[0].Price ,
                    "PriceSchedule":$scope.MasterProduct.StandardPriceSchedule,
                    "Product": $scope.MasterProduct,
                    "Quantity":1,
                    "Specs":{},
                    "UnitPrice":$scope.MasterProduct.StandardPriceSchedule.PriceBreaks[0].Price,
                    "qtyError":null,
                    "Variant":data
                };
                User.get(function(user) {
                    if (user.CurrentOrderID != null) {
                        Order.get(user.CurrentOrderID, function(order) {
                            order.LineItems.push(li);
                            addToOrder(order);
                        });
                    }
                    else {
                        var order = {};
                        order.LineItems = [];
                        order.LineItems.push(li);
                        addToOrder(order);
                    }
                });
            },
            function(ex) {
                console.log(ex);
        });


    };

    $scope.downloadIndPDF = function(document) {
        var variant = {
            "ProductInteropID": $scope.MasterProduct.InteropID,
            "Specs":{}
        };

        /*angular.forEach($scope.MasterProduct.Variants, function(v) {
            if (v.ExternalID == document.Name) {
                variant = v;
            }
        });

        if (variant.ExternalID) {
            Variant.get(variant.InteropID, function (v) {
                Variant.save(v, function(data) {
                        window.location.href = data.ProductionURL.replace('web.four51.com','.four51.com');;
                    },
                    function(ex) {
                        console.log(ex);
                    });
            });
        }
        else {*/
            variant.Specs = $scope.Collection.Specs;
            variant.Specs['Collection'] = {};
            variant.Specs['Collection'].Value = "false";
            variant.Specs['SaveAs'] = {};
            variant.Specs['SaveAs'].Value = document.Name;
            variant.Specs['DateLastUpdated'] = {};
            variant.Specs['DateLastUpdated'].Value = new Date().getTime();
            variant.Specs['Page1'] = {};
            variant.Specs['Page1'].Value = document.InteropID;

            Variant.save(variant, function(data) {
                    window.location.href = data.ProductionURL.replace('web.four51.com','.four51.com');;
                },
                function(ex) {
                    console.log(ex);
            });
        //}
    };

    $scope.addDivider = function(index) {
        var dividerPage = {
            "Type":"divider",
            "Headline":"",
            "Selected":true,
            "InteropID":randomString(),
            "ShowDividerBtn":false
        };

        $scope.Collection.SelectedDocuments.splice(index,0,dividerPage);
        analyzeDividers();
        $scope.cacheCollection();
    };

    $scope.objectLength = function(obj) {
        var length = 0;
        for (var key in obj) {
            length++;
        }
        return length;
    };

    $scope.isEven = function(index) {
        return index % 2 == 0;
    };

    $scope.settings = {
        currentPage: 1,
        pageSize: 12
    };

}]);