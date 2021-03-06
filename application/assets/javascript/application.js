
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
            .state('projects', {
                url: '/',
                templateUrl: 'application/templates/projects.html',
                controller: 'browseCtrl'
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
     
    app.controller('mainCtrl', function($scope, $http, $rootScope, $state, $timeout, $window) {
        // $http.get('application/data/json/data.json').success(function(data) {
        //     $scope.data = data;
        // });
        var inter;
        $timeout(function() {
            $scope.loaded = true;
        }, 600)
        $scope.redirectToExternalUrl = function(url) {
            $window.open(url, '_blank')
        }
    });

    app.controller('browseCtrl', function ($scope, $rootScope, $state, $timeout, $interval) {
        showAction(false);
        $scope.projects = [
            {
                name: 'GMaps editor',
                description: 'desc',
                short_description: 'short desc',
                image: 'application/assets/images/projects/gmaps.jpg',
                link: 'https://rvfakie.github.io/gmaps'
            },
            {
                name: 'BMW tech database',
                description: 'desc',
                short_description: 'short desc',
                image: 'application/assets/images/projects/bmw.jpg',
                link: 'https://rvfakie.github.io/bmw'
            },
            {
                name: 'The Village and Airbnb',
                description: 'desc',
                short_description: 'short desc',
                image: 'application/assets/images/projects/airbnb.jpg',
                link: 'http://specials.the-village.ru/airbnb'
            }
        ]
    })
    
    app.controller('indexCtrl', function ($scope, $rootScope, $state, $timeout, $interval) {

        $scope.fastShow = function() {
            showAction(false);
            $scope.usedTools = $scope.toolsQuery;
            $('.tools-wrapper').addClass('hard-shown');
            $('.tools').addClass('hard-hidden');
            $('.fast-load').addClass('hidden');
        };

        $scope.toolsText = ['tools', '.', 'push', '(', ')', ';'];
        $scope.toolsQuery = ['javascript', 'css3', 'html5', 'angular', 'jquery', 'gmaps', 'nodejs', 'npm', 'git', 'gulp', 'sass', 'less'];
        $scope.usedTools = [];

        var len = 0;
        
        
        showAction = function(bool) {
            $timeout(function() {
                if (bool === false) {
                    clearInterval(inter);
                    return;
                }

                textAction();
                $('.fast-load').removeClass('hidden');

                inter = setInterval(function() {
                    textAction();
                }, 7000);

            }, 2000);
        }

        showAction();

        getRandomInt = function(min, max) {
          return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        textAction = function() {
            $('.tools').removeClass('hidden');
            $('.tools').html('');
            if (len === $scope.toolsQuery.length) {
                len = 0;
                $scope.usedTools = [];
            }
            var ite = 0;
            var intervalTools = setInterval(function() {
                if (ite === 3) {
                    clearInterval(intervalTools);
                    $timeout(function() {
                        $('.tools').html($('.tools').html() + $scope.toolsQuery[len]);
                        $scope.usedTools.push($scope.toolsQuery[len]);
                        len++;
                    }, 200);
                    $timeout(function() {
                        $('.tools').html($('.tools').html() + $scope.toolsText[4]);
                    }, 400);
                    $timeout(function() {
                        $('.tools').html($('.tools').html() + $scope.toolsText[5]);
                    }, 600);
                    $timeout(function() {
                        $('.tools').addClass('hidden');
                        $timeout(function() {
                            $('.tools-wrapper').addClass('shown');
                        }, 1000);
                        $timeout(function() {
                            $('.tools-wrapper').removeClass('shown');
                        }, 3750);
                    }, 1500);
                }
                $('.tools').html($('.tools').html() + $scope.toolsText[ite])
                ite++;
            }, 200)
        };

        $rootScope.$broadcast('indexAllSet');
    })

})(angular);
