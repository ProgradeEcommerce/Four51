four51.app.factory('Order', ['$resource', '$rootScope', '$451', 'Security', 'Error', function($resource, $rootScope, $451, Security, Error) {
	var _multipleShip = false;
	function _then(fn, data) {
		if (angular.isFunction(fn))
			fn(data);
		$rootScope.$broadcast('event:orderUpdate', data);
	}

	function _extend(order) {
		order.isEditable = order.Status == 'Unsubmitted' || order.Status == 'Open';
        var productImages = {};
		angular.forEach(order.LineItems, function(item) {
			item.OriginalQuantity = item.Quantity; //needed to validate qty changes compared to available quantity
			angular.forEach(item.Specs, function(spec) {
				if (spec.ControlType == 'File' && spec.File && spec.File.Url.indexOf('auth') == -1)
					spec.File.Url += "&auth=" + Security.auth();
			});
			item.SpecsLength = Object.keys(item.Specs).length;

            if (item.Variant && item.Variant.Specs) {
                item.IsCollection = (item.Product.InteropID == "MASTER" && (item.Variant.Specs && item.Variant.Specs['Collection'].Value == 'true'));
                item.IsIndDoc = (item.Product.InteropID == "MASTER" && (item.Variant.Specs && item.Variant.Specs['Collection'].Value == 'false'));
            }
            else {
                item.IsCollection = (item.Product.InteropID == "MASTER" && (item.Specs && item.Specs['Collection'].Value == 'true'));
                item.IsIndDoc = (item.Product.InteropID == "MASTER" && (item.Specs && item.Specs['Collection'].Value == 'false'));
            }

            if (item.IsCollection) {
                item.PageCount = 0;
                for (var spec in item.Variant.Specs) {
                    if (item.Variant.Specs[spec].Name.indexOf('Page') == 0 && item.Variant.Specs[spec].Value) {
                        item.PageCount++;
                    }
                }
            }

            if (!productImages[item.Product.InteropID]) {
                productImages[item.Product.InteropID] = {
                    "LargeImageUrl":item.Product.LargeImageUrl,
                    "SmallImageUrl":item.Product.SmallImageUrl
                }
            }
            else {
                item.Product.LargeImageUrl = productImages[item.Product.InteropID].LargeImageUrl;
                item.Product.SmallImageUrl = productImages[item.Product.InteropID].SmallImageUrl;
            }
		});

		order.forceMultipleShip = function(value) {
			_multipleShip = value;
		}
		order.IsMultipleShip = function() {
			var multi = false;
			if (_multipleShip && order.LineItems[0].ShipAddressID == null) return true;
			angular.forEach(order.LineItems, function(li, i) {
				if (multi) return;
				multi = i > 0 ?
					(li.ShipAddressID != order.LineItems[i-1].ShipAddressID || li.ShipperID != order.LineItems[i-1].ShipperID) :
					false;
			});
			return multi;
		}
	}

	var _get = function(id, success) {
		var currentOrder = store.get('451Cache.Order.' + id);
		currentOrder ? (function() { _extend(currentOrder);	_then(success, currentOrder); })() :
	        $resource($451.api('order')).get({'id': id }).$promise.then(function(o) {
		        _extend(o);
		        store.set('451Cache.Order.' + id, o);
	            _then(success, o);
	        });
    }

    var _save = function(order, success, error) {
        $resource($451.api('order')).save(order).$promise.then(
	        function(o) {
		        store.set('451Cache.Order.' + o.ID, o);
		        _extend(o);
	            _then(success, o);
	        },
	        function(ex) {
		        error(Error.format(ex));
	        }
        );
    }

    var _delete = function(order, success, error) {
        $resource($451.api('order')).delete().$promise.then(
	        function() {
		        store.remove('451Cache.Order.' + order.ID);
	           _then(success);
	        },
	        function(ex) {
		        error(Error.format(ex));
	        }
        );
    }

    var _submit = function(order, success, error) {
        $resource($451.api('order'), { }, { submit: { method: 'PUT' }}).submit(order).$promise.then(
	        function(o) {
		        store.set('451Cache.Order.' + o.ID);
		        _extend(o);
	            _then(success,o);
	        },
	        function(ex) {
		        error(Error.format(ex));
	        }
        );
    }

    var _repeat = function(id, success, error) {
        $resource($451.api('order/repeat/:id'), {'id': id}, { repeat: { method: 'PUT'}}).repeat().$promise.then(
            function(o) {
                store.set('451Cache.Order.' + o.ID);
                store.remove('451Cache.User' + $451.apiName);
                _extend(o);
                _then(success, o);
            },
            function(ex) {
                error(Error.format(ex));
            }
        );
    }

    var _approve = function(order, success, error) {
        $resource($451.api('order/approve/:id'), {'id': order.ID}, { approve: { method: 'PUT', params: { 'comment': order.ApprovalComment}}}).approve().$promise.then(
            function(o) {
                _extend(o);
                _then(success, o);
            },
            function(ex) {
                error(Error.format(ex));
            }
        );
    }

    var _decline = function(order, success, error) {
        $resource($451.api('order/decline/:id'), {'id': order.ID}, { decline: { method: 'PUT', params: { 'comment': order.ApprovalComment}}}).decline().$promise.then(
            function(o) {
                _extend(o);
                _then(success, o);
            },
            function(ex) {
                error(Error.format(ex));
            }
        );
    }

    var _deletelineitem = function(id, lineitemid, success, error) {
        store.remove('451Cache.Order.' + id);
        $resource($451.api('order/:id/lineitem/:lineitemid'), {'id': id, 'lineitemid': lineitemid }, { lineitemdelete: { method: 'DELETE'}}).lineitemdelete().$promise.then(
            function(o) {
                if (o.ID) {
                    store.set('451Cache.Order.' + o.ID, o);
                    _extend(o);
                    _then(success, o);
                } else {
                    store.remove('451Cache.User' + $451.apiName);
                    _then(success, null);
                }
            },
            function(ex) {
                error(Error.format(ex));
            }
        );
    }

    return {
        get: _get,
        save: _save,
        delete: _delete,
        submit: _submit,
        repeat: _repeat,
        approve: _approve,
        decline: _decline,
        deletelineitem: _deletelineitem
    }
}]);