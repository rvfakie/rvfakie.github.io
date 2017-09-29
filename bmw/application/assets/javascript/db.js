(function(angular) {
    var app = angular.module('myModule', ['angular-toArrayFilter','ui.bootstrap','ui.mask', 'ui.router', 'ngAnimate'])
    
    .directive('selectStylizeDirective', function() {
	  return function(scope) {
	    if (scope.$last){
	      // iteration is complete, do whatever post-processing
	      // is necessary
	      stylizeFilterSelect()
	    }
	  };
	});

	app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

		$locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });

		$urlRouterProvider.otherwise('/');

		$stateProvider

		// HOME STATES AND NESTED VIEWS ========================================
			.state('cars', {
				url: '/',
				templateUrl: 'application/templates/cars.html'
			})

			.state('rims', {
				url: '/',
				templateUrl: 'application/templates/rims.html'
			})


		//fix this (remove) and remove base index.html
		// $locationProvider.html5Mode(true);

	});
	
	app.controller('rimsCtrl', function ($scope, $http) {
		$http.get('application/assets/json/rims_data.json').success(function(data) {
			$scope.data = data;
		})

		$scope.pageClass = 'page-1';

		//TODO do something with this shit
		$scope.seri = ["5 - Series"];

		$scope.choose = function (value) {
			$scope.rimImage = value.image;
			$scope.rimTech = value.tech;
		}

		$scope.filterSeriesSelectReset = function() {
			if ($scope.series.series == '') {
				$scope.series = undefined;
			}
			closeCarInfo();
		}

		$scope.filterCarBodyReset = function() {
			$scope.bodies = undefined;
		}

		$scope.filterRimStyleReset = function() {
			$scope.styles = undefined;
		}

		$scope.allFiltersReset = function () {
			$scope.bodies = undefined;
			$scope.styles = undefined;
			$scope.series = undefined;
			stylizeFilterSelect();
		}

		$scope.checkCarBodyChange = function() {
			if ($scope.bodies.bodies == '' || $scope.bodies.bodies == undefined) {
				$scope.bodies = undefined;
			}
			closeCarInfo();
		}

		$scope.checkRimStyleChange = function() {
			if ($scope.styles.name == '' || $scope.styles.name == undefined) {
				$scope.styles = undefined;
			}
			closeCarInfo();
		}

		$scope.filterIsSelected = function() {
			var filterArray = [$scope.bodies, $scope.styles, $scope.series];
			var additiveArray = [];

			for (i in filterArray) {
				if (filterArray[i]) {
					additiveArray.push('filter[' + i + ']');
				}
			}

			return additiveArray.length;
		}
	})
     
    app.controller('carsCtrl', function($scope, $http, $window) {

		$scope.pageClass = 'page-2';

	    $scope.choose = function(value) {
			$scope.carBody = value.body;
		    $scope.carImage = value.image;
		    $scope.carSerie = value.serie;
		    $scope.carModel = value.model;
			$scope.models = (function() {
				return $scope.carModel[Object.keys($scope.carModel).sort()[0]];
			})();
			
		    stylizeModelSelect();
	    }

		$scope.allFiltersReset = function () {
			$scope.carbody = undefined;
			$scope.mPowerChecked = undefined;
			$scope.series = undefined;
			stylizeFilterSelect();
		}
	    
	    $scope.filterTextInputReset = function() {
		    $scope.carbody = undefined;
		    $scope.mPowerChecked = undefined;
	    }
	    
	    $scope.filterSeriesSelectReset = function() {
		    if ($scope.series.serie == '') {
				$scope.series = undefined;
		    } else if ($scope.mPowerChecked != undefined) {
				$scope.filterTextInputReset();
			}
			closeCarInfo();
	    }
	    
	    $scope.checkCarBodyChange = function() {
		    if ($scope.carbody.body == '' || $scope.carbody.body == undefined) {
			    $scope.carbody = undefined;
			    $scope.mPowerChecked = undefined;
		    } 
		    else if ($scope.carbody.body.toUpperCase() == 'M') {
			    $scope.mPowerChecked = 'M';
				$scope.series = undefined;
				stylizeFilterSelect();
			}
			closeCarInfo();
	    }
	    
	    $scope.toggleMPower = function() {
			$scope.carbody = {'body': $scope.mPowerChecked};
			$scope.series = undefined;
			stylizeFilterSelect()
			$scope.checkCarBodyChange();
	    }
	    
	    $scope.filterIsSelected = function() {
			var filterArray = [$scope.carbody, $scope.series];
			var additiveArray = [];
			
			for (i in filterArray) {
				if (filterArray[i]) {
					additiveArray.push('filter[' + i + ']');
				}
			}
			
			return additiveArray.length;
	    }

		//TODO Загружать .json файл с датой Синхронно*
	    
	    // Тут много картинок с бехами https://bmw.inchcape.ru/2-serii/bmw-f22-cbu-220i-coupe/

		$http.get('application/assets/json/cars_data.json').success(function(data) {
			$scope.data = data;

			//Для пагинации
			$scope.displayItems = $scope.data.slice(0, 10);
		});
		
		//Для пагинации
		$scope.page = 1;
		
	})
	
     
})(angular, window.location);