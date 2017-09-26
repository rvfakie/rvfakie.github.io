
(function(angular) {
    var app = angular.module('applicationModule', ['ui.router', 'ngAnimate']);

    app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });

        $urlRouterProvider.otherwise('/');

        $stateProvider

            .state('about', {
                url: '/',
                templateUrl: 'application/templates/about.html',
                controller: 'indexCtrl'
            })

            // nested view category
            // .state('articles/articleName', {
            //     url: '/articles/:articleName',
            //     templateUrl: 'application/templates/article.html',
            //     controller: 'singleArticleCtrl',
            //     resolve: {
            //         name: function ($stateParams) {
            //             return $stateParams.articleName;
            //         }
            //     }
            // })


    });
     
    app.controller('mainCtrl', function($scope, $http, $rootScope, $state, $timeout) {
        // $http.get('application/data/json/data.json').success(function(data) {
        //     $scope.data = data;
        // });
        $timeout(function() {
            $scope.loaded = true;
        }, 600)
    });
    
    app.controller('indexCtrl', function ($scope, $rootScope, $state, $timeout) {
        $rootScope.$broadcast('indexAllSet');
    })

})(angular);
