
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

    app.service('Map', function($q, $http, $rootScope, dataService) {
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
            var activeMarker;

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

            var input = document.getElementById('pac-input');
            var searchBox = new google.maps.places.SearchBox(input);
            //this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);

            this.addPolyline = function(load) {
                this.polyline = new google.maps.Polyline({
                    path: emptyArray,
                    geodesic: true,
                    strokeColor: defaultPolylineColor,
                    strokeOpacity: 1.0,
                    strokeWeight: 3,
                    clickable: true
                });

                polylinesArray.push(this.polyline);

                this.polyline.setMap(this.map);

                index = polylinesArray.length;

                google.maps.event.addListener(this.polyline, 'click', function() {
                    if (!markerLogic) {
                        var thisIndex = polylinesArray.indexOf(this);

                        if (index !== thisIndex+1) {
                            self.setIndex(thisIndex+1);
                        }

                        $rootScope.$broadcast('selectPolyline', {
                            polylineIndex: thisIndex+1
                        });
                    }
                });

                $rootScope.$broadcast('setPolyline', {
                    quantity: index,
                    dontApply: load
                });

                ga('set', 'page', 'set new polyline');
                ga('send', 'pageview');
            };

            this.addMarker = function(latLng, dontApply, text) {

                this.marker = new google.maps.Marker({
                    position: latLng,
                    map: self.map,
                    animation: google.maps.Animation.DROP,
                    clickable: true,
                    draggable: true,
                    text: text,
                    icon: {
                        url: 'application/assets/images/triangle.svg',
                        scaledSize: new google.maps.Size(30, 38),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(15, 38)
                    }
                });
                markersArray.push(this.marker);

                if (!markerLogic) {
                    this.marker.setOptions({draggable: false, clickable: false});
                }

                $rootScope.$broadcast('setMarker', {
                    quantity: markersArray.length,
                    dontApply: dontApply
                });

                google.maps.event.addListener(this.marker, 'click', function () {
                    this.setOptions({animation: google.maps.Animation.BOUNCE});
                    activeMarker = this;

                    showNamesInput(activeMarker);
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

                ga('set', 'page', 'set new marker');
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

                var len = polyline.latLngs.b[0].b.length;

                if (len < 2) {
                    this.window = new google.maps.InfoWindow({
                        content: '<div class="wndw" onclick="console.log('+ index +')">'+ index.toString() +'</div>'
                    });
                    if (polylineBubblesArray[index-1]) {
                        polylineBubblesArray[index-1].push(this.window);
                    } else {
                        polylineBubblesArray.push([this.window]);
                    }

                    if (!markerLogic) {
                        this.window.open(this.map, this.marker);
                    }
                }

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
                    quantity: index,
                    dontApply: true
                });

                newPolyline = true;

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
                    quantity: markersArray.length,
                    dontApply: true
                });
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

                    if (activeMarker) {
                        hideNamesInput(activeMarker);
                    }

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

            this.back = function(dontApply) {
                switch (markerLogic) {
                    case true:
                        // lastUndo.set = markersArray[markersArray.length - 1];
                        // lastUndo.array = markersPositionsArray[markersPositionsArray.length - 1];

                        markersArray[markersArray.length - 1].setMap(null);
                        markersArray.pop();

                        $rootScope.$broadcast('setMarker', {
                            quantity: markersArray.length,
                            dontApply: dontApply
                        });
                        break;

                    case false:
                        if (polylinesArray.length && index <= polylinesArray.length) {
                            if (polylinesArray[index-1].latLngs.b[0].b.length != 1) {

                                polylineMarkersArray[index-1][polylineMarkersArray[index-1].length-1].setMap(null);

                                polylineMarkersArray[index-1].pop();
                                polylinesArray[index-1].getPath().pop();
                            } else {
                                //removing polylines from map
                                polylinesArray.splice(index-1, 1);

                                //removing polyline markers
                                polylineMarkersArray[index-1][polylineMarkersArray[index-1].length-1].setMap(null);
                                polylineMarkersArray.splice(index-1, 1);

                                //removing polyline infowindow
                                polylineBubblesArray[index-1][0].close();
                                polylineBubblesArray.splice(index-1, 1);

                                //resetting polylines infowindows
                                for (var i = 0; i < polylineBubblesArray.length; i++) {
                                    polylineBubblesArray[i][0].setContent(
                                        '<div class="wndw" onclick="console.log('+ (i+1) +')">'+ (i+1).toString() +'</div>'
                                    );
                                    polylineBubblesArray[i][0].open(self.map, polylineMarkersArray[i][0]);
                                }

                                console.log('deleted last polyline in array and its array');

                                if (!polylinesArray.length) {
                                    newPolyline = true;
                                }

                                index = polylinesArray.length;

                                if (index >= 1) {
                                    self.setPolylineSelectedColor(polylinesArray[index-1]);
                                }

                                $rootScope.$broadcast('setPolyline', {
                                    quantity: index,
                                    dontApply: dontApply
                                });
                            }
                        } else {
                            newPolyline = true;
                        }
                        break;
                }
                ga('set', 'page', 'undo');
                ga('send', 'pageview');
            };

            this.undo = function(dontApply) {
                if (back.length) {
                    if (activeMarker) {
                        hideNamesInput(activeMarker)
                    }
                    
                    var lastAction = back[back.length-1];
                    switch (lastAction.action) {
                        case 'addMarker':
                            markersArray[markersArray.indexOf(lastAction.data.marker)].setMap(null);
                            markersArray.pop();
                            
                            $rootScope.$broadcast('setMarker', {
                                quantity: markersArray.length,
                                dontApply: dontApply
                            });
                            break;
                        case 'dragMarker':
                            lastAction.data.marker.setPosition(lastAction.data.latLng);
                            break;
                        case 'continuePolyline':
                            lastAction.data.polyline.getPath().pop();
                            lastAction.data.marker.setMap(null);
                            polylineMarkersArray[lastAction.data.index].pop();

                            if (!polylineMarkersArray[lastAction.data.index].length) {
                                lastAction.data.window.close();
                                polylineMarkersArray.splice(lastAction.data.index, 1);
                                polylineBubblesArray.splice(lastAction.data.index, 1);
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
                                    dontApply: dontApply
                                });

                                if (!polylinesArray.length) {
                                    newPolyline = true;
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
                            var l = polylinesArray[i].latLngs.b[0].b;

                            plArray.push(l)

                            //plArray.push([]);
                            // for (var inside in l) {
                            //     plArray[i].push({lat: l[inside].lat(), lng: l[inside].lng()})
                            // }
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
                          self.addMarker(data[em].markers[mk].position, true, data[em].markers[mk].text);
                      }
                  }
                  if (data[em].polylines) {
                      // console.log(data[em].polylines)
                      for (var pl in data[em].polylines) {
                          self.addPolyline(true);
                          newPolyline = false;
                          for (var cd in data[em].polylines[pl]) {
                              self.continuePolyline(data[em].polylines[pl][cd])
                          }
                      }
                  }
                }
            };
            
            this.newPolyline = function() {
                newPolyline = true;
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
            this.togglePolylineWindows = function(bool) {
                for (var i = 0; i < polylineBubblesArray.length; i++) {
                    if (bool) {
                        polylineBubblesArray[i][0].open(self.map, polylineMarkersArray[i][0]);
                    } else {
                        polylineBubblesArray[i][0].close();
                    }
                }
            };
            this.toggleDrag = function(dontApply) {
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
                    drag: !draggable,
                    dontApply: dontApply
                });
            };

            document.addEventListener('keydown', keyDownHandler);
            function keyDownHandler(event) {
                if (document.getElementById('pac-input') !== document.activeElement && document.getElementById('markerInp') !== document.activeElement && document.getElementById('uploadData') !== document.activeElement) {
                    //console.log(event.keyCode)
                    if (event.keyCode === 90) {
                        self.undo(false);

                        // ga('set', 'page', 'Z pressed');
                        // ga('send', 'pageview');
                    }
                    if (event.keyCode === 78) {
                        newPolyline = true;
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
                        var l = polylinesArray[i].latLngs.b[0].b;
                        plArray.push(l)
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
        $scope.gotMarkers = false;

        var addressInput = document.getElementById('pac-input');

        Map.setListeners($scope.enableMarkers, $scope.enablePolylines);

        $scope.enableM = function() {
            $scope.enableMarkers = true;
            $scope.enablePolylines = !$scope.enableMarkers;
            $scope.enablePolygons = !$scope.enableMarkers;
            Map.togglePolylineWindows();
        };
        $scope.enableP = function() {
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
            Map.toggleDrag(true);
        };
        $scope.setZoom = function(bool) {
            Map.zoomControl(bool)
        };
        $scope.selectPolyline = function() {
            Map.setIndex(parseInt($scope.selectedIndex));
        };
        $scope.newPolyline = function() {
            Map.newPolyline();
        };
        $scope.deletePolylines = function() {
            Map.deletePolylines();
        };
        $scope.deleteMarkers = function() {
            Map.deleteMarkers();
        };
        $scope.undo = function() {
            Map.undo(true);
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

        $scope.$on('selectPolyline', function(event, data) {
            if (data.polylineIndex !== $scope.selectedIndex) {
                $scope.selectedIndex = data.polylineIndex;
            }

            if (!data.dontApply) {
                $scope.$apply();
            }
        });
        $scope.$on('setPolyline', function(event, data) {
            if (data.quantity) {
                $scope.polygonsData = [];

                for (var i = 0; i < data.quantity; i++) {
                    $scope.polygonsData.push({name: i})
                }
                $scope.selectedIndex = $scope.polygonsData.length;
            } else {
                $scope.selectedIndex = null;
            }

            if (!data.dontApply) {
                $scope.$apply();
            }
        });
        $scope.$on('setMarker', function(event, data) {
            if (data.quantity) {
                $scope.gotMarkers = true;
            } else {
                $scope.gotMarkers = false;
            }

            if (!data.dontApply) {
                $scope.$apply();
            }
        });
        $scope.$on('toggleDrag', function(event, data) {
            $scope.disableDrag = data.drag;
            if (!data.dontApply) {
                $scope.$apply();
            }
        });
        $scope.$on('setMode', function(event, data) {
            if (data.markers) {
                $scope.enableM();
            } else {
                $scope.enableP();
            }
            $scope.$apply();
        });

        $rootScope.$broadcast('indexAllSet');
    })

})(angular);
