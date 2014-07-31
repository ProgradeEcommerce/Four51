four51.app.filter('onproperty', ['$451', function($451) {
	var defaults = {
		'OrderStats': 'Type',
		'Message': 'Box'
	};

	return function(input, query) {
		if (!input || input.length === 0) return;
		if (!query) return input;
		query.Property = query.Property || defaults[query.Model];
		return $451.filter(input, query);
	}
}]);

four51.app.filter('kb', function() {
	return function(value) {
		return isNaN(value) ? value : parseFloat(value) / 1024;
	}
});

four51.app.filter('r', ['$sce', 'WhiteLabel', function($sce, WhiteLabel) {
	return function(value) {
		var result = value, found = false;
		angular.forEach(WhiteLabel.replacements, function(c) {
			if (found) return;
			if (c.key == value) {
				result = $sce.trustAsHtml(c.value);
				found = true;
			}
		});
		return result;
	}
}]);

four51.app.filter('rc', ['$sce', 'WhiteLabel', function($sce, WhiteLabel) {
	return function(value) {
		var result = value, found = false;
		angular.forEach(WhiteLabel.replacements, function(c) {
			if (found) return;
			if (c.key.toLowerCase() == value.toLowerCase()) {
				result = $sce.trustAsHtml(c.value);
				found = true;
			}
		});
		return result;
	}
}]);

four51.app.filter('rl', ['$sce', 'WhiteLabel', function($sce, WhiteLabel) {
	return function(value) {
		var result = value, found = false;
		angular.forEach(WhiteLabel.replacements, function(c) {
			if (found) return;
			if (c.key.toLowerCase() == value.toLowerCase()) {
				result = $sce.trustAsHtml(c.value.toLowerCase());
				found = true;
			}
		});
		return result;
	}
}]);

four51.app.filter('noliverates', function() {
	return function(value) {
		var output = [];
		angular.forEach(value, function(v) {
			if (v.ShipperRateType != 'ActualRates')
				output.push(v);
		});
		return output;
	}
});

four51.app.filter('paginate', function() {
	return function(input, start) {
		start = +start; //parse to int
		return input.slice(start);
	}
});



//Document Builder Filters

four51.app.filter('categoryfilter', function() {
    return function(documents,categories,favoriteDocs) {
        if (documents && categories) {
            var results = [];

            if (categories.length > 0) {
                for (var d = 0; d < documents.length; d++) {
                    if (documents[d].StaticSpecGroups && documents[d].StaticSpecGroups['Category']){
                        for (var dc in documents[d].StaticSpecGroups['Category'].Specs) {
                            if (categories.indexOf(documents[d].StaticSpecGroups['Category'].Specs[dc].Value) > -1) {
                                results.push(documents[d]);
                            }
                        }
                    }
                }
                if (favoriteDocs) {
                    for (var i = 0; i < results.length; i++) {
                        if (!results[i].Favorite) {
                            results.splice(i,1);
                        }
                    }
                }
            }
            else {
                results = documents;
            }

            return results;
        }
    }
});

four51.app.filter('favDocs', function() {
    return function(documents,favoriteDocs) {
        if (documents) {
            var results = [];

            if (favoriteDocs) {
                for (var i = 0; i < documents.length; i++) {
                    if (documents[i].Favorite) {
                        results.push(documents[i]);
                    }
                }
            }
            else {
                results = documents;
            }

            return results;
        }
    }
});

four51.app.filter('dateRange', function() {
    return function(documents,fromDate,toDate) {
        if (fromDate || toDate) {
            results = [];

            function strDateTointDate(date) {
                date = new Date(date).getTime();
                return date;
            }

            for (var i = 0; i < documents.length; i++) {
                if (documents[i].StaticSpecGroups.DateLastUpdated) {
                    var documentDate = strDateTointDate(documents[i].StaticSpecGroups.DateLastUpdated.Specs['0'].Value);
                    var inRange = true;
                    if (fromDate) {
                        if (fromDate.getTime() > documentDate) {
                            inRange = false;
                        }
                    }
                    if (toDate) {
                        if ((toDate.getTime()+86400000) < documentDate) {
                            inRange = false;
                        }
                    }
                    if (inRange) {
                        results.push(documents[i]);
                    }
                }
            }

            return results;
        }
        else {
            return documents;
        }
    }
});

four51.app.filter('collectionDateRange', function() {
    return function(collections,fromDate,toDate) {
        if (fromDate || toDate) {
            results = [];

            for (var i = 0; i < collections.length; i++) {
                var inRange = true;
                if (fromDate && collections[i].Specs) {
                    if (fromDate.getTime() > +(collections[i].Specs['DateLastUpdated'].Value)) {
                        inRange = false;
                    }
                }
                if (toDate && collections[i].Specs) {
                    if ((toDate.getTime()+86400000) < +(collections[i].Specs['DateLastUpdated'].Value)) {
                        inRange = false;
                    }
                }
                if (inRange) {
                    results.push(collections[i]);
                }
            }

            return results;
        }
        else {
            return collections;
        }
    }
});

four51.app.filter('dateFilter', function() {
    return function (dateTime,type) {
        if (dateTime) {
            dateTime = new Date(+(dateTime));
            var day = dateTime.getDate();
            var month = dateTime.getMonth() + 1;
            var year = dateTime.getFullYear();
            var hours = dateTime.getHours();
            var minutes = dateTime.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            var date = month + "/" + day + "/" + year + "|" + strTime;

            var result = "";

            switch(type) {
                case "date":
                    result = date.split('|')[0];
                    break;
                case "time":
                    result = date.split('|')[1];
                    break;
                default:
                    result = "";
                    break;
            }

            return result;
        }
    }
});

four51.app.filter('collectionName', function() {
    return function (name,isCollection) {
        if (name) {
            name = isCollection ? name.split(' - ')[1] : name;
        }
        return name;
    }
});

four51.app.filter('collectionFilter', function() {
    return function(collections, keyword, collectionDocs, docNames) {
        if (keyword) {
            var results = [];

            angular.forEach(collections, function(collection) {
                var valid = false;
                angular.forEach(collection.Specs, function(spec) {
                    if (spec.Name.indexOf('Page') > -1 && spec.Value && docNames[spec.Value]) {
                        if (docNames[spec.Value].Name.toLowerCase().indexOf(keyword.toLowerCase()) > -1) {
                            valid = true;
                        }
                    }
                });
                if (valid) {
                    results.push(collection);
                }
            });

            return results;
        }
        else {
            return collections;
        }
    }
});

four51.app.filter('pagefilter', function() {
    return function(specs) {
        var results = {};

        angular.forEach(specs, function(spec) {
            if (spec.Name && spec.Name.indexOf('Page') == 0 && spec.Value) {
                results[spec.Name] = spec;
            }
        });

        return results;
    }
});
