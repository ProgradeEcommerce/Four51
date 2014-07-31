four51.app.factory('DocumentBuilder', ['$resource', '$451', 'Resources', 'Variant', function($resource, $451, Resources, Variant) {
    function _then(fn, data1, data2, data3, data4, data5) {
        if (angular.isFunction(fn)) {
            fn(data1, data2, data3, data4, data5);
        }
    }

    var _buildFilters = function(documents) {
        documents.Filters = [];
        angular.forEach(documents, function(doc) {
            if (doc.StaticSpecGroups && doc.StaticSpecGroups['Category']) {
                for (var category in doc.StaticSpecGroups['Category'].Specs) {
                    if (doc.StaticSpecGroups['Category'].Specs[category].Value && documents.Filters.indexOf(doc.StaticSpecGroups['Category'].Specs[category].Value) == -1) {
                        documents.Filters.push(doc.StaticSpecGroups['Category'].Specs[category].Value);
                    }
                }
            }
        });
        documents.Filters.sort();
    };

    var _buildCollectionLists = function(masterProduct, docNames, success) {

        function compare(a,b) {
            if (a.ExternalID < b.ExternalID)
                return -1;
            if (a.ExternalID > b.ExternalID)
                return 1;
            return 0;
        }

        var variantList = [];
        var collectionList = [];
        var inactiveCollectionList = [];
        var collectionIDs = [];
        var collectionDocuments = [];
        var collectionCount = 0;
        if (masterProduct.Variants.length == 0) {
            _then(success, variantList, collectionList, inactiveCollectionList, collectionIDs, collectionDocuments);
        }
        else {
            angular.forEach(masterProduct.Variants, function(variant) {
                Variant.get({VariantInteropID: variant.InteropID, ProductInteropID: masterProduct.InteropID}, function(v) {
                    if (v.Specs['Collection'].Value == 'true') {
                        collectionCount++;
                        v.PageCount = 0;
                        for (var spec in v.Specs) {
                            if (v.Specs[spec].Name.indexOf('Page') == 0 && v.Specs[spec].Value) {
                                v.PageCount++;
                                if (docNames[v.Specs[spec].Value] && collectionDocuments.indexOf(docNames[v.Specs[spec].Value].Name) == -1) {
                                    collectionDocuments.push(docNames[v.Specs[spec].Value].Name);
                                }
                            }
                        }
                        v.DateLastUpdated = v.Specs['DateLastUpdated'].Value;
                        if (v.Specs['Active'].Value == 'true' && collectionIDs.indexOf(v.InteropID) == -1) {
                            collectionList.push(v);
                            collectionList.sort(compare);
                        }
                        else if (v.Specs['Active'].Value == 'false' && collectionIDs.indexOf(v.InteropID) == -1) {
                            inactiveCollectionList.push(v);
                            inactiveCollectionList.sort(compare);
                        }
                        collectionIDs.push(v.InteropID);

                        if ((collectionList.length + inactiveCollectionList) == collectionCount) {
                            _then(success, variantList, collectionList, inactiveCollectionList, collectionIDs, collectionDocuments);
                        }
                    }
                });
            });
        }
    };

    var _buildCollectionSpecs = function(collection,documents,masterProduct) {
        collection.Specs = {};
        var filteredSpecs = Resources.filteredSpecs ? Resources.filteredSpecs : [];
        angular.forEach(documents, function(document) {
            if (document.StaticSpecGroups['Specs']) {
                document.Specs = {};
                angular.forEach(document.StaticSpecGroups['Specs'].Specs, function(spec) {
                    if (spec.Name && filteredSpecs.indexOf(spec.Value) == -1) {
                        collection.Specs[spec.Value] = {"Value":""};
                        if (masterProduct.Specs[spec.Value]) {
                            document.Specs[spec.Value] = masterProduct.Specs[spec.Value];
                        }
                    }
                });
            }
        });
    };

    var _buildCoverLetterSpecs = function(collection,documents,masterProduct) {
        if (documents && documents['COVERLETTER'] && documents['COVERLETTER'].StaticSpecGroups) {
            if (collection.CoverLetter && !collection.CoverLetter.Title) {
                collection.CoverLetter = {"Title":"","Specs":{}};
                angular.forEach(documents['COVERLETTER'].StaticSpecGroups.Specs.Specs, function(spec) {
                    if (spec.Name) {
                        var label = masterProduct.Specs[spec.Value].Label;
                        var name = masterProduct.Specs[spec.Value].Name;
                        collection.CoverLetter.Specs[spec.Value] = {"Value":"","Label":label,"Name":name};
                    }
                });
            }
        }
    };

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

    var _buildCopy = function(scopeCollection, collection, docList, masterProduct, extraDocs) {
        var documentList = docList;
        var vCollection = collection;
        scopeCollection.InteropID = collection.InteropID;
        angular.forEach(collection.Specs, function(spec) {
            if (spec.Name) {
                if (spec.Name.indexOf('Page') == -1) {
                    scopeCollection.Specs[spec.Name] = spec;
                }
                else {
                    if (spec.Value.indexOf('CL') == 0) {
                        scopeCollection.CoverLetter.Title = vCollection.Specs['CoverLetterTitle'].Value;
                        scopeCollection.CoverLetter.Specs = {};
                        angular.forEach(extraDocs['COVERLETTER'].StaticSpecGroups.Specs.Specs, function(spec) {
                            if (spec.Name) {
                                var label = masterProduct.Specs[spec.Value].Label;
                                var value = vCollection.Specs[spec.Value].Value;
                                scopeCollection.CoverLetter.Specs[spec.Value] = {"Value":value,"Label":label};
                            }
                        });
                    }
                    else if (spec.Value.indexOf('Div') == 0) {
                        var dividerIndex = spec.Value.split('Div')[1];
                        var dividerPage = {
                            "Type":"divider",
                            "Headline":collection.Specs['DividerHeadline' + dividerIndex].Value,
                            "Selected":true,
                            "InteropID":randomString(),
                            "ShowDividerBtn":false
                        };
                        scopeCollection.SelectedDocuments.push(dividerPage);
                    }
                    else {
                        var filteredSpecs = Resources.filteredSpecs ? Resources.filteredSpecs : [];
                        angular.forEach(documentList, function(document) {
                            if (document.ExternalID == spec.Value) {
                                document.Selected = true;
                                if (document.StaticSpecGroups['Specs']) {
                                    document.Specs = {};
                                    angular.forEach(document.StaticSpecGroups['Specs'].Specs, function(spec) {
                                        if (spec.Name && filteredSpecs.indexOf(spec.Value) == -1) {
                                            //collection.Specs[spec.Value] = {"Value":""};
                                            if (masterProduct.Specs[spec.Value]) {
                                                document.Specs[spec.Value] = masterProduct.Specs[spec.Value];
                                                document.Specs[spec.Value].Value = collection.Specs[spec.Value].Value;
                                                scopeCollection.Specs[spec.Value] = document.Specs[spec.Value];
                                            }
                                        }
                                    });
                                }
                                document.Type = 'document';
                                scopeCollection.SelectedDocuments.push(document);
                            }
                        });
                    }
                }
            }
        });

        scopeCollection.Title = collection.ExternalID;
    };

    var _resetDocList = function(docList) {
        angular.forEach(docList, function(doc) {
            doc.Selected = false;
        });
    }

    return {
        buildFilters: _buildFilters,
        buildCollectionLists: _buildCollectionLists,
        buildCollectionSpecs: _buildCollectionSpecs,
        buildCoverLetterSpecs: _buildCoverLetterSpecs,
        buildCopy: _buildCopy,
        resetDocList: _resetDocList
    };
}]);