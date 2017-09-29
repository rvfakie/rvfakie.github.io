
(function(angular) {
    var app = angular.module('applicationModule', ['angular-toArrayFilter','ui.bootstrap','ui.mask', 'ui.router', 'ngDropdowns']);

    app.directive('onErrorSrc', function() {
        return {
            link: function(scope, element, attrs) {
                element.bind('error', function() {
                    if (attrs.src != attrs.onErrorSrc) {
                        attrs.$set('src', attrs.onErrorSrc);
                    }
                });
            }
        }
    });

    app.directive("ngUploadChange",function(){
        return{
            scope:{
                ngUploadChange:"&"
            },
            link:function($scope, $element, $attrs){
                $element.on("change",function(event){
                    //TODO check max file size
                    console.log(event.target.files[0].size);
                    var reader = new FileReader(),
                        base64 = '';
                    reader.onload = function (loadEvent) {
                        base64 = loadEvent.target.result;
                        $scope.ngUploadChange({$event: event, base: base64});
                    };
                    reader.readAsDataURL(event.target.files[0]);
                });
                $scope.$on("$destroy",function(){
                    $element.off();
                });
            }
        }
    });

    app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

        $locationProvider.html5Mode({
            enabled: true
        });

        $urlRouterProvider.otherwise('/');

        $stateProvider

            .state('/', {
                url: '/',
                templateUrl: 'application/templates/index.html'
            })
            .state('categories', {
                url: '/categories',
                templateUrl: 'application/templates/categories.html'
            })
            .state('adminka', {
                url: '/adminka',
                templateUrl: 'application/templates/adminka.html',
            })

            // nested view category
            .state('categories/catName', {
                url: '/categories/:catName',
                templateUrl: '/application/templates/category.html',
                controller: function($scope, $rootScope, $stateParams){
                    var catName = $stateParams.catName;

                    $rootScope.$watch('categories', function() {
                        for (var category in $rootScope.categories) {
                            if ($rootScope.categories[category].name.toLowerCase() == $scope.whiteSpaces(catName) || $rootScope.categories[category].name.toLowerCase() == $scope.whiteSpaces($scope.transliterate(catName, true))) {
                                $scope.getFilters($rootScope.categories[category], $scope);
                                $scope.itemFilter = $scope.categoryFilters[0];

                                var index = $rootScope.categories.indexOf($rootScope.categories[category]);
                                $scope.category = $rootScope.categories[index];
                            }
                        }
                    });
                },
                resolve: {
                    name: function ($stateParams) {
                        return $stateParams.catName;
                    }
                }
            })

            // nested view item in category
            .state('categories/catName/itemName', {
                url: '/categories/:catName/:itemName',
                templateUrl: '/application/templates/item.html',
                controller: function($scope, $rootScope, $stateParams){

                    var catName = $stateParams.catName,
                        itemName = $stateParams.itemName;

                    $rootScope.$watch('categories', function() {
                        for (var category in $rootScope.categories) {
                            if ($rootScope.categories[category].name.toLowerCase() == $scope.whiteSpaces(catName) || $rootScope.categories[category].name.toLowerCase() == $scope.whiteSpaces($scope.transliterate(catName, true))) {
                                var index = $rootScope.categories.indexOf($rootScope.categories[category]);

                                $scope.category = $rootScope.categories[index];

                                for (var item in $scope.category.items) {
                                    if ($scope.category.items[item].name.toLowerCase() == $scope.whiteSpaces(itemName) || $scope.category.items[item].name.toLowerCase() == $scope.whiteSpaces($scope.transliterate(itemName, true))) {
                                        var itemIndex = $scope.category.items.indexOf($scope.category.items[item]);
                                        $scope.item = $scope.category.items[itemIndex];
                                    }
                                }
                            }
                        }
                    });
                },
                resolve: {
                    name: function ($stateParams) {
                        return $stateParams.catName + '/' + $stateParams.itemName;
                    }
                }
            });


    });
     
    app.controller('dataCtrl', function($scope, $http, $rootScope, $state, $timeout) {
        $http.get('application/assets/json/data.json').success(function(data) {
            $rootScope.categories = data.categories;
            $scope.sale = data.sale[0];
            $scope.data = data;

            //Custom select init
            $scope.ddSelectOptions = $rootScope.categories;
            $scope.$root.ddSelectSelected = $rootScope.categories[0];
            
        });
        $scope.itemPage = 1;
        $scope.catPage = 1;
        $scope.previewItemPage = 1;

        $scope.addProperty = function(property, value) {
            if (value) {
                property.push({'name':'', 'value': ''});
            } else {
                property.push({'name':''});
            }
        };
        $scope.deleteProperty = function(key3, value) {
            var index = value.indexOf(key3);
            value.splice(index, 1);
        };
        $scope.addRow = function(value) {
            value.items[value.items.length] = new Object({
                'name':'',
                'price':'',
                'discount_value':'',
                'discount_enabled':false,
                'discount_currency':false,
                "color_enabled": false,
                "size_enabled": false,
                "description": '',
                "override_sale": false,
                "disable_discount": false,
                "filter": [],
                "image": [],
                "color": [],
                "size": []
            });
        };
        $scope.removeRow = function(value, key2) {
            $(document).unbind('clickYes');
            $(document).bind('clickYes', function () {
                var index = value.items.indexOf(key2);
                value.items.splice(index, 1);
                $scope.$apply();
            });

            $('.panel-popup-wrapper').css('display','block');
            $('.agree').on('click', function() {
                $(document).trigger('clickYes');
                $('.panel-popup-wrapper').css('display','none');
                $(document).unbind('clickYes');
            });
            $('.decline').on('click', function() {
                $('.panel-popup-wrapper').css('display','none');
            });
        };
        $scope.addPartition = function() {
            $rootScope.categories[$rootScope.categories.length] = new Object({
                'name':'',
                'cat_discount':[{
                    'enabled':false,
                    'percentage':false,
                    'value':''
                }],
                'items':[{
                    'name':'',
                    'price':'',
                    'discount_value':'',
                    'discount_enabled':false,
                    'discount_currency':false,
                    "color_enabled": false,
                    "size_enabled": false,
                    "description": '',
                    "override_sale": false,
                    "disable_discount": false,
                    "filter": [],
                    "image": [],
                    "color": [],
                    "size": []
                }]
            });
        };
        $scope.removePartition = function(categories, key) {
            var test = confirm('Удалить раздел `' + categories[key].name + '` ?');
            if (test) {
                var index = categories.indexOf(categories[key]);
                categories.splice(index, 1);

                //get the scopes root model
                $scope.$root.ddSelectSelected = categories[0];
            }
        };

        $scope.checkItemListLength = function(elementScope) {
            elementScope.$watch('numPages', function() {
                if (elementScope.numPages > elementScope.itemPage) {
                    elementScope.itemPage++;
                }
            });
        };
        $scope.checkCategoryListLength = function(elementScope) {
            elementScope.$watch('numPages', function() {
                if (elementScope.numPages > elementScope.catPage) {
                    elementScope.catPage++;
                }
            });
        };
        $scope.checkItemDiscountValue = function(value) {
            //Проценты меньше 100
            if (!value.discount_currency && value.discount_value >= 100) {
                value.discount_currency = true;
            }
            //Скидка в валюте меньше цены
            if (value.price && value.discount_enabled) {
                if (value.discount_currency && value.discount_value >= value.price) {
                    value.discount_value = '';
                }
            }
        };
        $scope.checkDiscountValue = function(value, discountArray) {
            if (value >= 100) {
                discountArray.value = '';
                discountArray.enabled = false;
            }
            if (!value) {
                discountArray.enabled = false;
            }
        };
        $scope.checkValidItemInCategory = function(value){
            for (var index in value) {
                if (value[index].name && value[index].price) {
                    return true;
                }
            }
        };

        $scope.calculatePrice = function(value, cat) {
            if (cat && value) {
                var checkSum = value.price;

                //disable discount
                if ($scope.sale.enabled && value.disable_discount || cat.cat_discount[0].enabled && value.disable_discount) {
                    return checkSum;
                }

                //sale discount active
                if ($scope.sale.enabled && !value.override_sale || ($scope.sale.enabled && value.override_sale && !value.discount_value)) {
                    checkSum = Math.round(checkSum * (100 - $scope.sale.value) / 100);

                //override all
                } else if ($scope.sale.enabled && value.override_sale && value.discount_enabled && value.discount_value || cat.cat_discount[0].enabled && value.override_sale && value.discount_enabled && value.discount_value) {

                    if (!value.discount_currency && value.discount_value < 100) {
                        checkSum = Math.round(checkSum * (100 - value.discount_value) / 100);
                    } else {
                        checkSum -= value.discount_value;
                    }

                } else {
                    //cat discount active
                    if (cat.cat_discount[0].enabled) {
                        checkSum = Math.round(checkSum * (100 - cat.cat_discount[0].value) / 100);
                    } else {
                        //item discount active
                        if (value.discount_enabled) {
                            if (!value.discount_currency && value.discount_value < 100) {
                                checkSum = Math.round(checkSum * (100 - value.discount_value) / 100);
                            } else {
                                checkSum -= value.discount_value;
                            }
                        }
                    }
                }
                //nothing active
                return checkSum;
            }
        };
        $scope.calculateDiscount = function(value, cat) {
            if (cat && value) {
                //disable discount
                if ($scope.sale.enabled && value.disable_discount || cat.cat_discount[0].enabled && value.disable_discount) {
                    return;
                }
                //no price
                if (!value.price && $scope.sale.enabled || !value.price && value.discount_value && value.discount_enabled || !value.price && cat.cat_discount[0].enabled) {
                    return;
                }
                //sale active
                if ($scope.sale.enabled && !value.override_sale || ($scope.sale.enabled && value.override_sale && !value.discount_value)) {
                    return $scope.sale.value+'%';
                //override all
                } else if ($scope.sale.enabled && value.override_sale && value.discount_enabled && value.discount_value || cat.cat_discount[0].enabled && value.override_sale && value.discount_enabled && value.discount_value) {
                    if (!value.discount_currency && value.discount_value < 100) {
                        return value.discount_value+'%';
                    } else {
                        return value.discount_value+' руб';
                    }
                } else {
                    //cat discount active
                    if (cat.cat_discount[0].enabled && cat.cat_discount[0].value) {
                        return cat.cat_discount[0].value+'%';
                    } else {
                        //item discount active
                        if (value.discount_enabled && value.discount_value) {
                            if (!value.discount_currency && value.discount_value < 100) {
                                return value.discount_value+'%';
                            } else {
                                return value.discount_value+' руб';
                            }
                        }
                    }
                }
                return;
            }
        };
        $scope.showDiscountInitiator = function(value, cat) {
            if (cat && value) {
                //disable discount
                if ($scope.sale.enabled && value.disable_discount || cat.cat_discount[0].enabled && value.disable_discount) {
                    return 'Не участвует в скидках';
                }
                if (!value.price && $scope.sale.enabled || !value.price && value.discount_enabled || !value.price && cat.cat_discount[0].enabled) {
                    return 'Необходимо указать цену';
                }
                if ($scope.sale.enabled && !value.override_sale || ($scope.sale.enabled && value.override_sale && !value.discount_value)) {
                    return 'Распродажа';
                } else if ($scope.sale.enabled && value.override_sale && value.discount_enabled && value.discount_value || cat.cat_discount[0].enabled && value.override_sale && value.discount_enabled && value.discount_value) {
                    return 'Действует скидка товара';
                } else {
                    //cat discount active

                    if (cat.cat_discount[0].enabled) {
                        return 'Категория';
                    } else {
                        //item discount active
                        if (value.discount_enabled && value.discount_value) {
                            return 'Товар';
                        }
                    }
                }
                return;
            }
        };

        $scope.initCustomSelect = function() {
            $scope.$root.ddSelectSelected = $rootScope.categories[0];
        };
        $scope.getRowNumber = function(key, value) {
            var index = value.indexOf(key);
            return index + 1;

        };
        $scope.getNewValidObject = function(value, filter) {
            var obj = new Object([]);
            for (var index in value) {
                if (value[index].name && value[index].price) {
                    //Если есть фильтр то выводим отфильтрованные
                    if (filter) {
                        for (var key in value[index].filter) {
                            if (value[index].filter[key].name.search(filter) != -1) {
                                obj.push(value[index])
                            }
                        }
                    } else {
                        obj.push(value[index])
                    }
                }
            }
            return obj;
        };
        $scope.getFilters = function(value, elementScope) {
            var obj = new Object([{
                'name': 'Все',
                'value': ''
            }]);

            for (var key2 in value.items) {
                if (value.items[key2].filter && value.items[key2].name && value.items[key2].price) {
                    for (var index in value.items[key2].filter) {
                        if (value.items[key2].filter[index].name && value.items[key2].filter[index].value) {
                            obj.push({
                                'name': value.items[key2].filter[index].name,
                                'value': value.items[key2].filter[index].name
                            });
                        }
                    }
                }
            }
            elementScope.categoryFilters = removeDuplicates(obj, 'name');
        };

        $scope.fileChanged = function($event, base, value) {
            var files = $event.target.files;

            value.push({
                "name": files[0].name,
                "value": base
            });
            $scope.$apply();
        };
        $scope.removeImage = function(key, value) {
            var index = value.indexOf(key);
            value.splice(index, 1);
            //$scope.$apply();
        };
        
        $scope.save = function() {
            //use json-server --watch dist/application/data/json/data.json
            // $http.post('http://localhost:3000/categories', $scope.categories).then(function() {
            //     console.log('sent '+ JSON.stringify($scope.categories));
            // });

            //new window with string json
            var uri = "data:application/json;charset=UTF-8," + encodeURIComponent(JSON.stringify(angular.copy($scope.data), null, "\t"));
            window.open(uri);

            // angular way but not pretty
            // var dataStr = "data:text/json;charset=utf-8," + angular.toJson($scope.data);

            // var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(angular.copy($scope.data), null, "\t"));
            // var dlAnchorElem = document.getElementById('downloadAnchorElem');
            // dlAnchorElem.setAttribute("href", dataStr);
            // dlAnchorElem.setAttribute("download", getNow() + ".json");
            // dlAnchorElem.click();
        };
        
        //EXPERIMENTAL

        $scope.transliterate = function(text, engToRus) {
            if (text) {
                var rus = "щ   ш  ч  ц  ю  я  ё  ж  ъ  ы  э  а б в г д е з и й к л м н о п р с т у ф х ь".split(/ +/g),
                    eng = "shh sh ch cz yu ya yo zh yi y je a b v g d e z i j k l m n o p r s t u f x '".split(/ +/g);

                for(var x = 0; x < rus.length; x++) {
                    text = text.split(engToRus ? eng[x] : rus[x]).join(engToRus ? rus[x] : eng[x]);
                    text = text.split(engToRus ? eng[x].toUpperCase() : rus[x].toUpperCase()).join(engToRus ? rus[x].toUpperCase() : eng[x].toUpperCase());
                }

                text = text.split(' ').join('_');

                return text;
            }
        };
        $scope.whiteSpaces = function(text) {
            text = text.split('_').join(' ');
            return text;
        };
        
        //Elements classes
        $scope.preferencesActive = false;
        $scope.togglePreferences = function() {
            $scope.preferencesActive = !$scope.preferencesActive;
        };

        //Preview

    });

})(angular);

