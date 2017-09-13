
(function(angular) {
    // ['angular-toArrayFilter','ui.bootstrap','ui.mask', 'ui.router', 'ngDropdowns', 'ngAnimate']
    var app = angular.module('applicationModule', ['ui.router']);

    app.run(function($rootScope) {
        $(window).on('beforeunload pagehide', function() {
            $rootScope.$broadcast('saveState');
        });
    });

    app.service('dataService', function($rootScope) {

        var data = {
            content: []
        };

        function saveState() {
            window.localStorage.GMapsData = angular.toJson(data.content);
        }
        function restoreState() {
            data.content = angular.fromJson(window.localStorage.GMapsData);
            if (data.content.length) {
                // After ctrlLoad (this means that Map is also loaded)
                $rootScope.$on('indexAllSet', function() {
                    $rootScope.$broadcast('restoreState');
                });
            }
        }

        $rootScope.$on("saveState", saveState);

        if (window.localStorage.GMapsData) {
            restoreState();
        }

        return data;
    });

    app.directive('googleplace', function() {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, model) {
                this.inp = new google.maps.places.SearchBox(element[0]);

                google.maps.event.addListener(this.inp, 'places_changed', function() {
                    scope.$apply(function() {
                        model.$setViewValue(element.val());
                    });
                });
            }
        };
    });

    app.service('Map', function($q, $http, $rootScope, dataService, $timeout) {
        this.init = function(mapId) {

            var polylinesArray = [], markersArray = [],
                polylineMarkersArray = [], polylineBubblesArray = [];

            var back = [];

            var defaultPolylineColor = '#3f3f3f';
            var selectedPolylineColor = '#FF0000';

            var emptyArray = [];
            var self = this;
            var markerLogic, lineLogic, polygonLogic;
            var newPolyline = true,
                lastPolyline;
            var index = 0,
                defaultZoom = 10;
            var draggable = true;

            var isClosed = false;

            var moscowCenter = new google.maps.LatLng(55.763585,37.560883);

            var options = {
                center: moscowCenter,
                zoom: defaultZoom,
                disableDefaultUI: true,
                scrollwheel: true,
                navigationControl: false,
                mapTypeControl: false,
                scaleControl: true,
                draggable: true,
                draggableCursor: 'default',
                disableDoubleClickZoom: false
            };
            this.map = new google.maps.Map(document.getElementById(mapId), options);

            this.geocoder = new google.maps.Geocoder();

            this.addMarker = function(latLng, text) {

                this.marker = new google.maps.Marker({
                    position: latLng,
                    map: self.map,
                    animation: google.maps.Animation.DROP,
                    clickable: true,
                    draggable: true,
                    text: text
                });
                markersArray.push(this.marker);

                if (!markerLogic) {
                    this.marker.setOptions({draggable: false, clickable: false});
                }

                $rootScope.$broadcast('setMarker', {
                    markers: markersArray
                });

                google.maps.event.addListener(this.marker, 'click', function () {
                    $rootScope.$broadcast('selectMarker', {
                        index: markersArray.indexOf(this)
                    });
                });

                back.push(
                    {
                        action: 'addMarker',
                        data: {
                            marker: this.marker
                        }
                    }
                );

                var dragStartCoord;

                google.maps.event.addListener(this.marker, 'dragstart', function (e) {
                    dragStartCoord = e.latLng;
                });

                google.maps.event.addListener(this.marker, 'dragend', function () {
                    back.push(
                        {
                            action: 'dragMarker',
                            data: {
                                marker: this,
                                latLng: dragStartCoord
                            }
                        }
                    );
                });


                $timeout(function() {
                    $('.config-element-wrapper').each(function() {
                        $(this).scrollTop($(this)[0].scrollHeight);
                    });
                });

                ga('set', 'page', 'set new marker');
                ga('send', 'pageview');

            };
            this.getMarkerName = function(ind) {
                return markersArray[ind].text;
            };
            this.setMarkerName = function(ind, text) {
                markersArray[ind].text = text;
            };
            this.selectMarker = function(ind) {
                for (var mk in markersArray) {
                    markersArray[mk].setOptions({animation: false})
                }
                if (ind >= 0 && ind !== null) {
                    markersArray[ind].setOptions({animation: google.maps.Animation.BOUNCE});
                }
            };
            this.deleteMarkers = function() {
                for (var m in markersArray) {
                    markersArray[m].setMap(null);
                }
                markersArray = [];
                function cr() {
                    for (var u in back) {
                        if (back[u].action === 'addMarker' || back[u].action === 'dragMarker') {
                            back.splice(u ,1);
                            cr();
                        }
                    }
                }
                cr();
                //TODO LOL TODO
                $rootScope.$broadcast('setMarker', {
                    markers: markersArray
                });
            };
            this.deleteSingleMarker = function(ind) {
                markersArray[ind].setMap(null);
                back = back.filter(function( obj ) {
                    return obj.data.marker !== markersArray[ind];
                });
                markersArray.splice(ind, 1);

                $rootScope.$broadcast('setMarker', {
                    markers: markersArray
                });
            };

            this.addPolyline = function(load, name) {
                this.polyline = new google.maps.Polyline({
                    path: emptyArray,
                    geodesic: true,
                    strokeColor: defaultPolylineColor,
                    strokeOpacity: 1.0,
                    strokeWeight: 3,
                    clickable: true,
                    name: name
                });

                polylinesArray.push(this.polyline);

                this.polyline.setMap(this.map);

                index = polylinesArray.length;

                google.maps.event.addListener(this.polyline, 'click', function(e) {
                    if (!markerLogic) {
                        var thisIndex = polylinesArray.indexOf(this);

                        if (index !== thisIndex+1) {
                            self.setIndex(thisIndex+1);
                        } else {
                            console.log('test')

                            //TESTING

                            var needle = {
                                minDistance: 9999999999, //silly high
                                index: -1,
                                latlng: null
                            };
                            this.getPath().forEach(function(routePoint, index){
                                var dist = google.maps.geometry.spherical.computeDistanceBetween(e.latLng, routePoint);
                                if (dist < needle.minDistance){
                                    needle.minDistance = dist;
                                    needle.index = index;
                                    needle.latlng = routePoint;
                                }
                            });
                            // The closest point in the polyline
                            console.log(needle.index);

                            // TODO FIX PLZ
                            this.getPath().b.splice(needle.index, 0, e.latLng);

                            var temporaryData = self.dump();

                            self.deletePolylines();
                            self.deleteMarkers();

                            self.load(JSON.parse(temporaryData));
                        }

                        $rootScope.$broadcast('selectPolyline', {
                            polylineIndex: thisIndex+1
                        });

                    }
                });

                $rootScope.$broadcast('setPolyline', {
                    quantity: index,
                    polylines: polylinesArray
                });

                $timeout(function() {
                    $('.config-element-wrapper').each(function() {
                        $(this).scrollTop($(this)[0].scrollHeight);
                    });
                });

                ga('set', 'page', 'set new polyline');
                ga('send', 'pageview');
            };
            this.addPolylineMarker = function(polyline, latLng) {
                this.marker = new google.maps.Marker({
                    position: latLng,
                    map: self.map,
                    clickable: false,
                    draggable: true,
                    icon: {
                        url: 'application/assets/images/round.svg',
                        scaledSize: new google.maps.Size(8, 8),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(4, 4)
                    }
                });

                if (markerLogic) {
                    this.marker.setOptions({draggable: false});
                }

                if (polylineMarkersArray[index-1]) {
                    polylineMarkersArray[index-1].push(this.marker);
                } else {
                    polylineMarkersArray.push([this.marker]);
                }

                var markerIndex = polyline.getPath().length;

                google.maps.event.addListener(this.marker, 'drag', function (e) {
                    polyline.getPath().setAt(markerIndex-1, e.latLng);
                });

                var dragStartCoord;

                google.maps.event.addListener(this.marker, 'dragstart', function (e) {
                    dragStartCoord = e.latLng;
                });

                google.maps.event.addListener(this.marker, 'dragend', function (e) {
                    back.push(
                        {
                            action: 'dragPolylineMarker',
                            data: {
                                marker: this,
                                latLng: dragStartCoord,
                                polyline: polyline,
                                markerIndex: markerIndex
                            }
                        }
                    );
                });

                var that = this;

                //TODO set draggable false if markerLogic

                // var len = polyline.latLngs.b[0].b.length;

                // if (len < 2) {
                //     this.window = new google.maps.InfoWindow({
                //         content: '<div class="wndw" onclick="console.log('+ index +')">'+ index.toString() +'</div>'
                //     });
                //     if (polylineBubblesArray[index-1]) {
                //         polylineBubblesArray[index-1].push(this.window);
                //     } else {
                //         polylineBubblesArray.push([this.window]);
                //     }
                //
                //     if (!markerLogic) {
                //         this.window.open(this.map, this.marker);
                //     }
                // }

                back.push({
                    action: 'continuePolyline',
                    data: {
                        polyline: polyline,
                        marker: that.marker,
                        index: index-1,
                        window: this.window
                    }
                });

            };
            this.continuePolyline = function(latLng) {

                if (lastPolyline !== polylinesArray[index - 1]) {

                    lastPolyline = polylinesArray[index - 1];

                    if (!markerLogic) {
                        self.setPolylineSelectedColor(lastPolyline);
                    }

                }

                if (typeof latLng.lat === "number" && typeof latLng.lng === "number") {
                    var pos = new google.maps.LatLng(latLng.lat, latLng.lng);
                    lastPolyline.getPath().push(pos);
                } else {
                    lastPolyline.getPath().push(latLng);
                }

                self.addPolylineMarker(lastPolyline, latLng);

                ga('set', 'page', 'continue polyline');
                ga('send', 'pageview');

            };
            this.setPolylineSelectedColor = function(polyline) {
                for (var line in polylinesArray) {
                    polylinesArray[line].setOptions({
                        strokeColor: defaultPolylineColor
                    })
                }
                if (polyline) {
                    polyline.setOptions({
                        strokeColor: selectedPolylineColor
                    })
                }
            };
            this.deleteSinglePolyline = function(ind) {
                polylinesArray[ind-1].setMap(null);
                for (var x in polylineMarkersArray[ind-1]) {
                    polylineMarkersArray[ind-1][x].setMap(null)
                }
                polylineBubblesArray[ind-1][0].close();

                back = back.filter(function( obj ) {
                    return obj.data.polyline !== polylinesArray[ind-1];
                });

                polylinesArray.splice(ind-1, 1);
                polylineMarkersArray.splice(ind-1, 1);
                polylineBubblesArray.splice(ind-1, 1);

                //resetting polylines infowindows
                for (var i = 0; i < polylineBubblesArray.length; i++) {
                    polylineBubblesArray[i][0].setContent(
                        '<div class="wndw" onclick="console.log('+ (i+1) +')">'+ (i+1).toString() +'</div>'
                    );
                    polylineBubblesArray[i][0].open(self.map, polylineMarkersArray[i][0]);
                }

                if (!polylinesArray.length) {
                    newPolyline = true;
                    $rootScope.$broadcast('newPolyline');
                }

                index = polylinesArray.length;

                if (index >= 1) {
                    self.setPolylineSelectedColor(polylinesArray[index-1]);
                }

                $rootScope.$broadcast('setPolyline', {
                    quantity: index,
                    polylines: polylinesArray
                });

            };
            this.setPolylineName = function(text) {
                polylinesArray[index-1].name = text;
            };
            this.getPolylineName = function() {
                return polylinesArray[index-1].name;
            };
            this.deletePolylines = function() {
                for (var p in polylinesArray) {
                    polylinesArray[p].setMap(null)
                }
                for (var m in polylineMarkersArray) {
                    for (var x in polylineMarkersArray[m]) {
                        polylineMarkersArray[m][x].setMap(null)
                    }
                }
                for (var b in polylineBubblesArray) {
                    for (var c in polylineBubblesArray[b]) {
                        polylineBubblesArray[c][0].close();
                    }
                }

                polylinesArray = [];
                polylineMarkersArray = [];
                polylineBubblesArray = [];
                index = 0;

                $rootScope.$broadcast('setPolyline', {
                    quantity: index
                });

                newPolyline = true;
                $rootScope.$broadcast('newPolyline');

                function cr() {
                    for (var u in back) {
                        if (back[u].action === 'continuePolyline' || back[u].action === 'dragPolylineMarker') {
                            back.splice(u ,1);
                            cr();
                        }
                    }
                }
                cr();
                //TODO LOL TODO
            };
            this.togglePolylineWindows = function(bool) {
                for (var i = 0; i < polylineBubblesArray.length; i++) {
                    if (bool) {
                        //polylineBubblesArray[i][0].open(self.map, polylineMarkersArray[i][0]);
                    } else {
                        polylineBubblesArray[i][0].close();
                    }
                }
            };
            this.newPolyline = function() {
                newPolyline = true;
                $rootScope.$broadcast('newPolyline');
            };

            //FOR POLYGONS
            var poly = new google.maps.Polyline({ map: this.map, path: [], strokeColor: "#FF0000", strokeOpacity: 1.0, strokeWeight: 2 });

            this.setListeners = function(marker, polyline, polygon, polylineIndex) {
                google.maps.event.clearListeners(this.map, 'click');

                google.maps.event.addListener(this.map, 'click', function(event) {
                    if (marker) {
                        self.addMarker(event.latLng);
                    }

                    //POLyGONS
                    // else if (polygonLogic) {
                    //     if (isClosed)
                    //         return;
                    //     var markerIndex = poly.getPath().length;
                    //     var isFirstMarker = markerIndex === 0;
                    //     var marker = new google.maps.Marker({
                    //         map: self.map,
                    //         position: event.latLng,
                    //         draggable: true });
                    //     if (isFirstMarker) {
                    //         google.maps.event.addListener(marker, 'click', function () {
                    //             if (isClosed)
                    //                 return;
                    //             var path = poly.getPath();
                    //             poly.setMap(null);
                    //             poly = new google.maps.Polygon({ map: self.map, path: path, strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWeight: 2, fillColor: "#FF0000", fillOpacity: 0.35 });
                    //             isClosed = true;
                    //         });
                    //     }
                    //     google.maps.event.addListener(marker, 'drag', function (dragEvent) {
                    //         poly.getPath().setAt(markerIndex, dragEvent.latLng);
                    //     });
                    //     poly.getPath().push(event.latLng);
                    // }

                    else {
                        if (newPolyline) {
                            self.addPolyline();
                            newPolyline = false;
                            $rootScope.$broadcast('existingPolyline');
                            polylineMarkersArray.push([]);
                            polylineBubblesArray.push([]);
                        }
                        self.continuePolyline(event.latLng);
                    }
                });

                if (marker) {
                    markerLogic = true;
                    lineLogic = false;
                    polygonLogic = false;

                    if (markersArray.length) {
                        for (var k in markersArray) {
                            markersArray[k].setOptions({draggable: true, clickable: true})
                        }
                    }

                    if (polylinesArray.length) {
                        for (var t in polylinesArray) {
                            polylinesArray[t].setOptions({clickable: false});
                            for (var m in polylineMarkersArray[t]) {
                                polylineMarkersArray[t][m].setOptions({draggable: false})
                            }
                        }
                        self.setPolylineSelectedColor(null);
                    }
                } else if (polygon) {
                    polygonLogic = true;
                    markerLogic = false;
                    lineLogic = false;
                } else {
                    lineLogic = true;
                    markerLogic = false;
                    polygonLogic = false;

                    if (markersArray.length) {
                        for (var k in markersArray) {
                            markersArray[k].setOptions({draggable: false, clickable: false})
                        }
                    }

                    if (polylinesArray.length) {
                        for (var t in polylinesArray) {
                            polylinesArray[t].setOptions({clickable: true});
                            for (var m in polylineMarkersArray[t]) {
                                polylineMarkersArray[t][m].setOptions({draggable: true})
                            }
                        }
                        self.setPolylineSelectedColor(polylinesArray[polylineIndex-1]);
                    }
                }
            };

            this.undo = function() {
                if (back.length) {
                    
                    var lastAction = back[back.length-1];
                    switch (lastAction.action) {
                        case 'addMarker':
                            markersArray[markersArray.indexOf(lastAction.data.marker)].setMap(null);
                            markersArray.pop();
                            
                            $rootScope.$broadcast('setMarker', {
                                markers: markersArray
                            });
                            break;
                        case 'dragMarker':
                            lastAction.data.marker.setPosition(lastAction.data.latLng);
                            break;
                        case 'continuePolyline':
                            var indexOfPolygon = polylinesArray.indexOf(lastAction.data.polyline);

                            lastAction.data.polyline.getPath().pop();
                            lastAction.data.marker.setMap(null);
                            polylineMarkersArray[indexOfPolygon].pop();

                            if (!polylineMarkersArray[indexOfPolygon].length) {
                                lastAction.data.window.close();
                                polylineMarkersArray.splice(indexOfPolygon, 1);
                                polylineBubblesArray.splice(indexOfPolygon, 1);
                                polylinesArray.pop();

                                for (var i = 0; i < polylineBubblesArray.length; i++) {
                                    polylineBubblesArray[i][0].setContent(
                                        '<div class="wndw" onclick="console.log('+ (i+1) +')">'+ (i+1).toString() +'</div>'
                                    );
                                    polylineBubblesArray[i][0].open(self.map, polylineMarkersArray[i][0]);
                                }
                                index = polylinesArray.length;
                                if (index >= 1) {
                                    self.setPolylineSelectedColor(polylinesArray[index-1]);
                                }
                                $rootScope.$broadcast('setPolyline', {
                                    quantity: index,
                                    polylines: polylinesArray
                                });

                                if (!polylinesArray.length) {
                                    newPolyline = true;
                                    $rootScope.$broadcast('newPolyline');
                                }
                            }
                            break;
                        case 'dragPolylineMarker':
                            lastAction.data.marker.setPosition(lastAction.data.latLng);
                            lastAction.data.polyline.getPath().setAt(lastAction.data.markerIndex -1, lastAction.data.latLng);
                            break;
                    }
                    back.pop();
                    ga('set', 'page', 'undo');
                    ga('send', 'pageview');
                } else {
                    showAction('Нечего отменять')
                }
            };
            
            this.save = function() {
                if (markersArray.length || polylinesArray.length) {
                    var dummy = document.createElement("input");
                    document.body.appendChild(dummy);
                    dummy.setAttribute("id", "dummy_id");
                    document.getElementById("dummy_id").value+='[';
                    var mkArray = [];
                    var plArray = [];

                    if (markersArray.length) {
                        for (var mk in markersArray) {
                            mkArray.push({
                                position: {
                                    lat: markersArray[mk].position.lat(),
                                    lng: markersArray[mk].position.lng()
                                },
                                text: markersArray[mk].text
                            });
                        }
                        document.getElementById("dummy_id").value+='{"markers":';
                        document.getElementById("dummy_id").value+=JSON.stringify(mkArray);
                        document.getElementById("dummy_id").value+='}';
                        ga('set', 'page', 'saved markers');
                        ga('send', 'pageview');
                    }
                    if (polylinesArray.length) {
                        for (var i = 0; i < polylinesArray.length; i++) {
                            var coord = polylinesArray[i].latLngs.b[0].b;

                            plArray.push({
                                position: coord,
                                text: polylinesArray[i].name
                            })

                        }
                        if (mkArray.length) {
                            document.getElementById("dummy_id").value+=',{"polylines":';
                        } else {
                            document.getElementById("dummy_id").value+='{"polylines":';
                        }
                        document.getElementById("dummy_id").value+=JSON.stringify(plArray);
                        document.getElementById("dummy_id").value+='}';
                        ga('set', 'page', 'saved polylines');
                        ga('send', 'pageview');
                    }
                    document.getElementById("dummy_id").value+=']';
                    dummy.select();
                    document.execCommand("copy");
                    showAction('Координаты сохранены в буфер');
                    document.body.removeChild(dummy);
                } else {
                    showAction('Нет ни одного маркера или линии');
                }

            };

            this.load = function(data) {
                for (var em in data) {
                  if (data[em].markers) {
                      for (var mk in data[em].markers) {
                          self.addMarker(data[em].markers[mk].position, data[em].markers[mk].text);
                      }
                  }
                  if (data[em].polylines) {
                      // console.log(data[em].polylines)
                      for (var pl in data[em].polylines) {
                          self.addPolyline(true, data[em].polylines[pl].text);
                          newPolyline = false;
                          $rootScope.$broadcast('existingPolyline');
                          for (var cd in data[em].polylines[pl].position) {
                              self.continuePolyline(data[em].polylines[pl].position[cd])
                          }
                      }
                  }
                }
            };

            this.dump = function() {
                var mkArray = [];
                var plArray = [];
                var output = '[';

                if (markersArray.length) {
                    for (var mk in markersArray) {
                        mkArray.push({
                            position: {
                                lat: markersArray[mk].position.lat(),
                                lng: markersArray[mk].position.lng()
                            },
                            text: markersArray[mk].text
                        });
                    }
                    output += '{"markers":';
                    output += JSON.stringify(mkArray);
                    output +='}';
                }
                if (polylinesArray.length) {
                    for (var i = 0; i < polylinesArray.length; i++) {
                        var coord = polylinesArray[i].latLngs.b[0].b;

                        plArray.push({
                            position: coord,
                            text: polylinesArray[i].name
                        })

                    }
                    if (mkArray.length) {
                        output +=',{"polylines":';
                    } else {
                        output +='{"polylines":';
                    }
                    output +=JSON.stringify(plArray);
                    output +='}';
                }
                output += ']';

                return output;
            };

            this.setPinFromAddress = function(address) {
                self.geocoder.geocode({'address': address}, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        switch (markerLogic) {
                            case true:

                                self.map.setCenter(results[0].geometry.location);
                                self.addMarker(results[0].geometry.location);

                                break;
                            case false:

                                if (newPolyline) {
                                    self.addPolyline();
                                    newPolyline = false;
                                    $rootScope.$broadcast('existingPolyline');
                                    polylineMarkersArray.push([]);
                                    polylineBubblesArray.push([]);
                                }
                                self.continuePolyline(results[0].geometry.location);

                                break;

                        }
                    } else {
                        showAction('Некорректный адрес')
                    }
                });
            };
            this.setCenterFromAddress = function(address) {
                self.geocoder.geocode({'address': address}, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        self.map.panTo(results[0].geometry.location);
                        self.map.setZoom(17);
                    } else {
                        showAction('Некорректный адрес')
                    }
                });
            };

            this.setIndex = function(selectedIndex) {
                if (newPolyline) {
                    newPolyline = false;
                    $rootScope.$broadcast('existingPolyline');
                }
                index = selectedIndex;

                self.setPolylineSelectedColor(polylinesArray[index - 1]);

                ga('set', 'page', 'selected index');
                ga('send', 'pageview');
            };
            this.zoomControl = function(bool) {
                var zoom = self.map.getZoom();
                if (bool) {
                    if (zoom < 22) {
                        self.map.setZoom(++zoom);
                    }
                } else {
                    if (zoom > 10) {
                        self.map.setZoom(--zoom);
                    }
                }
                ga('set', 'page', 'zoom pressed');
                ga('send', 'pageview');
            };
            this.toggleDrag = function() {
                if (draggable) {
                    self.map.setOptions({
                        draggable: false,
                        disableDoubleClickZoom: true,
                        scrollwheel: false
                    });
                    draggable = false;
                } else {
                    self.map.setOptions({
                        draggable: true,
                        disableDoubleClickZoom: false,
                        scrollwheel: true
                    });
                    draggable = true;
                }
                $rootScope.$broadcast('toggleDrag', {
                    drag: !draggable
                });
            };

            document.addEventListener('keydown', keyDownHandler);
            function keyDownHandler(event) {
                function check() {
                    for (var el in document.querySelectorAll('.pac-input')) {
                        if (document.querySelectorAll('.pac-input')[el] === document.activeElement) {
                            return;
                        }
                    }
                    return true;
                }

                if (check() && document.getElementById('markerInp') !== document.activeElement
                    && document.getElementById('uploadData') !== document.activeElement
                    && document.getElementById('polylineName') !== document.activeElement
                    && document.getElementById('markerName') !== document.activeElement) {

                    //console.log(event.keyCode)
                    if (event.keyCode === 90) {
                        self.undo();

                        // ga('set', 'page', 'Z pressed');
                        // ga('send', 'pageview');
                    }
                    if (event.keyCode === 78) {
                        newPolyline = true;
                        $rootScope.$broadcast('newPolyline');
                        ga('set', 'page', 'N pressed');
                        ga('send', 'pageview');
                    }
                    if (event.keyCode === 80) {
                        //P
                        self.setListeners(false, true, false, index);
                        $rootScope.$broadcast('setMode', {
                            markers: false
                        });
                        ga('set', 'page', 'P pressed');
                        ga('send', 'pageview');
                    }
                    if (event.keyCode === 77) {
                        //M
                        self.setListeners(true);
                        $rootScope.$broadcast('setMode', {
                            markers: true
                        });
                        ga('set', 'page', 'M pressed');
                        ga('send', 'pageview');
                    }
                    if (event.keyCode === 70) {
                        //F
                        self.toggleDrag();
                        ga('set', 'page', 'F pressed');
                        ga('send', 'pageview');
                    }
                    if (event.keyCode === 83) {
                        //S
                        self.save();
                        ga('set', 'page', 'S pressed');
                        ga('send', 'pageview');
                    }
                    if (event.keyCode === 84) {
                        //T for TEST
                        //self.back(false);
                    }
                }
            }

            this.setLocalStorage = function() {
                var mkArray = [];
                var plArray = [];
                var src = '';

                src += '[';
                if (markersArray.length) {
                    for (var mk in markersArray) {
                        mkArray.push({
                            position: {
                                lat: markersArray[mk].position.lat(),
                                lng: markersArray[mk].position.lng()
                            },
                            text: markersArray[mk].text
                        });
                    }
                    src += '{"markers":';
                    src += JSON.stringify(mkArray);
                    src +='}';
                }
                if (polylinesArray.length) {
                    for (var i = 0; i < polylinesArray.length; i++) {
                        var coord = polylinesArray[i].latLngs.b[0].b;
                        plArray.push({
                            position: coord,
                            text: polylinesArray[i].name
                        })
                    }
                    if (mkArray.length) {
                        src +=',{"polylines":';
                    } else {
                        src +='{"polylines":';
                    }
                    src +=JSON.stringify(plArray);
                    src +='}';
                }
                src += ']';
                return src;
            };

            // Saving state before unload
            $rootScope.$on('saveState', function() {
                dataService.content = self.setLocalStorage();
            });

            // Working after indexCtrl load
            $rootScope.$on('restoreState', function() {
                self.load(JSON.parse(dataService.content));
            });

            //remove all polygons func
            google.maps.Polygon.prototype.clearPolygons = function() {
                for (var i = 0; i < polygonsArray.length; i++ ) {
                    polygonsArray[i].setMap(null);
                }
                polygonsArray = [];
            };

        };
    });

    app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

        $locationProvider.html5Mode({
            enabled: true
        });

        $urlRouterProvider.otherwise('/');

        $stateProvider

            .state('/', {
                url: '/',
                templateUrl: 'application/templates/_index.html',
                controller: 'indexCtrl'
            })

            .state('articles', {
                url: '/articles',
                templateUrl: 'application/templates/articles.html',
                controller: ''
            })

            // nested view category
            .state('articles/articleName', {
                url: '/articles/:articleName',
                templateUrl: 'application/templates/article.html',
                controller: 'singleArticleCtrl',
                resolve: {
                    name: function ($stateParams) {
                        return $stateParams.articleName;
                    }
                }
            })

            // nested view item in category
            .state('#/categories/catName/itemName', {
                url: '/categories/:catName/:itemName',
                templateUrl: 'application/templates/item.html',
                controller: '',
                resolve: {
                    name: function ($stateParams) {
                        return $stateParams.catName + '/' + $stateParams.itemName;
                    }
                }
            });


    });
     
    app.controller('mainCtrl', function(Map, $scope, $http, $rootScope, $state, $timeout) {
        // $http.get('application/data/json/data.json').success(function(data) {
        //     $scope.data = data;
        // });
        // ga('set', 'page', 'index viewed');
        // ga('send', 'pageview');
    });
    
    app.controller('indexCtrl', function (Map, $scope, $rootScope, $state, $timeout) {
        Map.init('LAM_Map');

        $scope.enableMarkers = true;
        $scope.enablePolylines = false;
        $scope.enablePolygons = false;
        $scope.disableDrag = false;
        $scope.shortcutsToggled = false;
        $scope.instructionsToggled = false;
        $scope.glowing = false;
        $scope.confirmIsVisible = false;
        $scope.confirmCreateRoute = false;

        var addressInput = document.getElementById('global-search');

        Map.setListeners($scope.enableMarkers, $scope.enablePolylines);

        $scope.enableM = function() {
            $scope.enableMarkers = true;
            $scope.enablePolylines = !$scope.enableMarkers;
            $scope.enablePolygons = !$scope.enableMarkers;
            Map.togglePolylineWindows();
        };
        $scope.enableP = function() {
            $scope.selectedMarkerIndex = null;
            Map.selectMarker(null);

            $scope.enablePolylines = true;
            $scope.enableMarkers = !$scope.enablePolylines;
            $scope.enablePolygons = !$scope.enablePolylines;
            Map.togglePolylineWindows(true);
        };
        $scope.enableG = function() {
            $scope.enablePolygons = true;
            $scope.enableMarkers = !$scope.enablePolygons;
            $scope.enablePolylines = !$scope.enablePolygons;
        };
        $scope.setToMap = function() {
            Map.setListeners($scope.enableMarkers, $scope.enablePolylines, $scope.enablePolygons, $scope.selectedIndex);
        };

        $scope.setPinFromAddress = function() {
            if (addressInput.value) {
                Map.setPinFromAddress(addressInput.value)
            } else {
                showAction('Введите адрес')
            }
        };
        $scope.setCenterFromAddress = function() {
            if (addressInput.value) {
                Map.setCenterFromAddress(addressInput.value)
            } else {
                showAction('Введите адрес')
            }
        };

        $scope.toggleDraggable = function() {
            Map.toggleDrag();
        };
        $scope.setZoom = function(bool) {
            Map.zoomControl(bool)
        };

        $scope.selectPolyline = function(index) {
            Map.setIndex(parseInt(index));
            $scope.selectedIndex = index;
            $scope.polylineName = Map.getPolylineName($scope.selectedIndex);
        };
        $scope.newPolyline = function() {
            Map.newPolyline();
        };
        $scope.deletePolylines = function() {
            $scope.confirm('Вы уверены, что хотите удалить все линии?', Map.deletePolylines);
        };
        $scope.deleteSinglePolyline = function() {
            $scope.confirm('Вы уверены, что хотите удалить выбранную линию?', Map.deleteSinglePolyline, $scope.selectedIndex);
        };
        $scope.changePolylineName = function() {
            Map.setPolylineName($scope.polylineName);
            $scope.polylinesData[$scope.selectedIndex-1].name = $scope.polylineName;
        };

        $scope.selectMarker = function(index) {

            if ($scope.selectedMarkerIndex !== index) {
                $scope.selectedMarkerIndex = index;
                $scope.markerName = Map.getMarkerName(index);
                Map.selectMarker(index);
            } else {
                $scope.selectedMarkerIndex = null;
                Map.selectMarker(null);
            }
        };
        $scope.deleteMarkers = function() {
            var localFn = function() {
                $scope.markersData = [];
                $scope.selectedMarkerIndex = null;
            };
            $scope.confirm('Вы уверены, что хотите удалить все маркеры?', Map.deleteMarkers, null, localFn);
        };
        $scope.deleteSingleMarker = function() {
            $scope.confirm('Вы уверены, что хотите удалить выбранный маркер?', Map.deleteSingleMarker, $scope.selectedMarkerIndex);
        };
        $scope.changeMarkerName = function() {
            Map.setMarkerName($scope.selectedMarkerIndex, $scope.markerName);
            $scope.markersData[$scope.selectedMarkerIndex].name = $scope.markerName;
        };

        $scope.undo = function() {
            Map.undo();
        };
        $scope.save = function() {
            Map.save();
        };
        $scope.load = function(data) {
            try {
                Map.load(JSON.parse(data));
                $scope.showUpload = false;
                $scope.uploadData = '';
                showAction('Данные загружены')
            } catch (err) {
                showAction('Данные введены не верно')
            }
        };
        $scope.confirm = function(text, fn, argument, standaloneFn) {

            $scope.confirmIsVisible = true;
            $scope.confirmText = text;

            $('.agree-button').off('click');
            $(document).unbind('confirm');
            $(document).bind('confirm', function () {
                $('.agree-button').off('click');

                // A bit of ternary magic
                (argument) ? fn(argument) : (typeof argument === 'number') ? fn(argument) : fn();

                if (standaloneFn) {
                    standaloneFn();
                }
                $scope.confirmIsVisible = false;
                $timeout(function() {
                    $scope.$apply();
                })
            });

            $('.agree-button').on('click', function() {
                $(document).trigger('confirm');
                $(document).unbind('confirm');
                $('.agree-button').off('click');
            })
        };

        $scope.getSelectedRouteType = function() {
            var rType = '';
            switch ($scope.routeType) {
                case 'WALKING':
                    rType = 'Пешком'
                    break;
                case 'DRIVING':
                    rType = 'На машине'
                    break;
            }
            return rType;
        };
        $scope.routeBoxes = [{value: ''},{value: ''}];
        $scope.createRoute = function(type) {
            var output = [
                {
                    polylines: [
                        {
                            position: []
                        }
                    ]
                    // ,
                    // markers: []
                }
            ];

            var wayPoints = [];

            for (var i = 1;  i < $scope.routeBoxes.length; i++) {
                if (i !== $scope.routeBoxes.length - 1) {
                    wayPoints.push({
                        location: $scope.routeBoxes[i].value
                    })
                }
            }
            console.log(wayPoints)

            var request = {
                origin: $scope.routeBoxes[0].value,
                destination: $scope.routeBoxes[$scope.routeBoxes.length - 1].value,
                travelMode: type,
                waypoints: wayPoints,
                optimizeWaypoints: true
            };

            var directionsService = new google.maps.DirectionsService();

            directionsService.route(request, function(result, status) {
                if (status == 'OK') {

                    for (var k = 0; k < result.routes[0].overview_path.length; k++) {
                        output[0].polylines[0].position.push({
                            lat: result.routes[0].overview_path[k].lat(),
                            lng: result.routes[0].overview_path[k].lng()
                        });
                    }
                    Map.load(output);
                } else {
                    showAction('Невозможно построить маршрут по введенным адресам')
                }
                $scope.routeBoxes = [{value: ''},{value: ''}];
            });
        };

        $scope.$on('selectPolyline', function(event, data) {
            if (data.polylineIndex !== $scope.selectedIndex) {
                $scope.selectedIndex = data.polylineIndex;
                $scope.polylineName = Map.getPolylineName($scope.selectedIndex);
            }

            $timeout(function() {
                $scope.$apply();
            })
        });
        $scope.$on('setPolyline', function(event, data) {
            if (data.quantity) {
                $scope.polylinesData = [];

                for (var i = 0; i < data.polylines.length; i++) {
                    $scope.polylinesData.push({name: data.polylines[i].name})
                }
                $scope.selectedIndex = $scope.polylinesData.length;
                $scope.polylineName = $scope.polylinesData[$scope.polylinesData.length-1].name;
            } else {
                $scope.selectedIndex = null;
            }

            $timeout(function() {
                $scope.$apply();
            })
        });
        $scope.$on('newPolyline', function() {
            $scope.glowing = true;
            $timeout(function() {
                $scope.$apply()
            })
        });
        $scope.$on('existingPolyline', function() {
            $scope.glowing = false;
            $timeout(function() {
                $scope.$apply()
            })
        });

        $scope.$on('setMarker', function(event, data) {
            $scope.markersData = [];
            $scope.selectedMarkerIndex = null;
            Map.selectMarker(null);

            if (data.markers.length) {
                for (var i = 0; i < data.markers.length; i++) {
                    $scope.markersData.push({name: data.markers[i].text})
                }
            }
            $timeout(function() {
                $scope.$apply();
            })
        });
        $scope.$on('selectMarker', function(event, data) {
            if ($scope.selectedMarkerIndex !== data.index) {
                $scope.selectedMarkerIndex = data.index;
                $scope.markerName = Map.getMarkerName(data.index);
                Map.selectMarker(data.index);
            } else {
                $scope.selectedMarkerIndex = null;
                Map.selectMarker(null);
            }

            $timeout(function() {
                $scope.$apply();
            })
        });

        $scope.$on('toggleDrag', function(event, data) {
            $scope.disableDrag = data.drag;
            $timeout(function() {
                $scope.$apply();
            })
        });
        $scope.$on('setMode', function(event, data) {
            if (data.markers) {
                $scope.enableM();
            } else {
                $scope.enableP();
            }
            $timeout(function() {
                $scope.$apply();
            })
        });

        $rootScope.$broadcast('indexAllSet');
    })

})(angular);
