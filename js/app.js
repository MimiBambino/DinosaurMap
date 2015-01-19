// TODO:  
// Dinosaurs toggle from the legend.  The correct dinosaur displays when 
// clicked from the list.  Now I need to rewrite the clearDinoMarkers function
// so that only the expected dinosaurs are shown after a new click.
// Also when a marker is removed close any open infoboxes.
// Next I need to rewrite the API call to wikipedia to start as soon as 
// the markers are made and not call too many times per second
// Also work on Wikipedia image display


var map, geoCoder;
var person = false;

//function handleNoGeo(errorFlag) {
//    if (errorFlag == true) {
//        console.log("browser supports geoloc, but failed");
//    }
//    else {
//        console.log("no browser support for geoloc");
//    }
//    map.setCenter({lat: 53.5485, lng: -113.519499});
//}

var Dino = function(data) {
    this.name = ko.observable(data.name);
    this.continents = ko.observableArray(data.continents);
    this.locations = ko.observableArray(data.latLongs);
    this.food = ko.observable(data.food);
    this.description = ko.observable(data.description);
    this.markers = ko.observableArray();
    this.infobox = ko.observable();
    this.imageArray = ko.observableArray();

    this.icon = ko.computed(function() {
        if (this.food() === 'carnivore') {
            return 'img/tRex.png';
        } else if (this.food() === 'omnivore') {
            return 'img/blueDino41.png';
        } else if (this.food() === 'herbivore') {
            return 'img/plantEaterSm.png';
        }
    }, this);
}

var ViewModel = function() {

    // save a reference to ViewModel object
    var self = this;

    self.startLoc = new google.maps.LatLng(33.5, 7.6);

    self.init = function() {
        google.maps.event.addDomListener(window, 'load', self.initMap);
    };

    self.initMap = function() {
        //create a new StyledMapType and reference it with the style array
        var bluishStyledMap = new google.maps.StyledMapType(View.bluishMapStyle,
            {name: "Bluish Map"});
        google.maps.visualRefresh = true;

        //Setting starting options of map
        var mapOptions = {
            center: self.startLoc,
            zoom: 3,
            mapTypeControlOptions: {mapTypeIds: [google.maps.MapTypeId.TERRAIN, 'new_bluish_style']},
            maxZoom: 12,
            minZoom: 3
            };

        // Getting map DOM element
        var mapElement = document.getElementById('mapDiv');
        map = new google.maps.Map(mapElement, mapOptions);

        //relate new mapTypeId to the styledMapType object
        map.mapTypes.set('new_bluish_style', bluishStyledMap);
        //set this new mapTypeId to be displayed
        map.setMapTypeId('new_bluish_style');
        self.fetchFirebase();
    };

    self.firebaseData = {};
    // Retrieve data from Firebase
    self.fetchFirebase = function(){
        var FB = new Firebase("https://intense-inferno-1224.firebaseio.com/");
        FB.on('value', function(data) {
            self.firebaseData = data.val();
            var dinos = self.firebaseData.dinos;
            self.setDinoList(dinos);
            });
    };

    // Store a local copy of all dinoData
    self.dinoList = ko.observableArray();

    // Populate the dinoList array 
    self.setDinoList = function(data) {
        data.forEach(function(item) {
            self.dinoList().push( new Dino(item) );
        });
        self.createDinoMarkers();
    };

    // Keep track of marker groupings by type
    self.allDinoMarkers = ko.observableArray();
    self.carnivoreMarkers = ko.observableArray();
    self.omnivoreMarkers = ko.observableArray();
    self.herbivoreMarkers = ko.observableArray();

    // Create map markers and set each one as a property in the Dino object in the dinoList array
    self.createDinoMarkers = function() {
        var dinoList = self.dinoList();
        for (var i = 0; i < dinoList.length; i++) {
            var dino = dinoList[i];
            for (var j = 0; j < dino.locations().length; j++){
                var icon = dino.icon();
                var lat = dino.locations()[j][0];
                var lon = dino.locations()[j][1];
                var marker = new google.maps.Marker({
                    map: map,
                    position: {
                        lat: lat,
                        lng: lon
                    },
                    icon: icon,
                    title: dino.name(),
                    visible: false
                });
                if (dino.food() == 'carnivore') {
                    self.carnivoreMarkers().push(marker);
                } else if (dino.food() == 'herbivore') {
                    self.herbivoreMarkers().push(marker);
                } else if (dino.food() == 'omnivore') {
                    self.omnivoreMarkers().push(marker);
                }
                self.allDinoMarkers().push(marker);
                self.dinoLost[i].marker(marker);
            }
        }
        self.createInfoWindows();
    };

    // Create an infowindow for each marker
    // Need to make sure that only one info marker is created for each Dino in dinoList
    // and that it is reused for each marker of that dino type
    self.createInfoWindows = function() {
        var i = 0;
        var markers = self.allDinoMarkers();
        var length = markers.length;
        for (; i < length; i++) {
            var marker = markers[i];
            var infowindow = new google.maps.InfoWindow({
                content: "",
                title: marker.title
            });
            var j = 0;
            var dinos = self.dinoList();
            for (; j < dinos.length; j++) {
                if (dinos[j].name == marker.title) {
                    dinos[j].infowindow(infowindow);
                }
            }
            // Need to abstract this.  It should be made prior to the click event
            // and stored so that duplicate requests are not sent
            self.dinoDataRequest(infowindow);
            google.maps.event.addListener(marker, 'click', (function(marker) {
                return function() {
                    // Add more detail about location -- name the country or general location in markup
                    infowindow.open(map, marker);
                    //self.dinoDataRequest(infowindow);
                    map.panTo(marker.position);
                    };
                })(marker));
        }
        self.dinoPhotoRequest();
    };

    // Ajax call to Wikipedia to get content for infowindows
    self.dinoDataRequest = function(infowindow){
        var url = "http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles=";
        url += infowindow.title;

        $.ajax( {
            url: url,
            xhrFields: {
                withCredentials: true
            },
            dataType:'jsonp',
            success: function(response){
                var keys = Object.keys(response.query.pages);
                var key = parseInt(keys[0], 10);
                var paragraph = response.query.pages[key].extract.substring(0,300);
                // Add list of continents where dinosaur lived 
                infowindow.setContent("<div class='infoWindow'><h3>Hi, my name is <strong>" + marker.title + "</strong>!</h3></div><div>" + paragraph + "...</p></div><div>For more see: <a href='http://www.wikipedia.org/wiki/" + marker.title + "' target='_blank'>Wikipedia</a></div>");
            },
            type:'GET',
            headers: { 
                'Api-User-Agent': "Cynthia O\'Donnell: mimibambino@gmail.com",
                'Access-Control-Allow-Origin': true
             }
            } );
        console.log("request sent");
    };

    // Ajax call to find dinosaur images
    // Save images to a photoArray property for each dino in dinoList
    self.dinoPhotoRequest = function() {};


    /*self.dinoPhotoRequest = function(marker, infowindow){
        $.ajax({
            url: "http://en.wikipedia.org/w/api.php?action=query&titles=Al-Farabi&prop=pageimages&format=json&pithumbsize=100";
            xhrFields: {
                withCredentials: true
            },
            dataType:'jsonp',
            success: function(response){
                //var keys = Object.keys(response.query.pages);
                //var key = parseInt(keys[0], 10);
                //var paragraph = response.query.pages[key].extract.substring(0,300);
                // Add list of continents where dinosaur lived 
                infowindow.setContent("<div class='infoWindow'><h3>Hi, my name is " + marker.title + "!</h3></div><div>" + paragraph + "...</p></div><div>For more see: <a href='http://www.wikipedia.org/wiki/" + marker.title + "' target='_blank'>Wikipedia</a></div>");

            },
            type:'GET',
            headers: { 
                'Api-User-Agent': "Cynthia O\'Donnell: mimibambino@gmail.com",
                'Access-Control-Allow-Origin': true
             }
             })
    };*/

    // Begin User Interface Instructions and listen for events

    // If user has not searched yet, don't display any icons
    // *****************Refactoring Progress:  I stopped here*******************
    self.search = ko.observable(false);
    self.displayInstructions = function(){
        if (self.search()) {

        }
    }
    self.location = ko.observable("");

    self.getLocation = ko.computed(function() {
        geocoder = new google.maps.Geocoder();
        geocoder.geocode( {address: self.location()}, function(results,status) {
            //check if geocode was successful
            if (status == google.maps.GeocoderStatus.OK) {
                // if user's icon is already displayed, remove it from the screen
                if (person) {
                    personMarker.setMap(null);
                }
                // set true to indicate a search has been performed and to display markers
                self.search = true;

                // take the first result from the returned array
                var loc = results[0].geometry.location;
                //center map and display marker
                map.setCenter(loc);
                map.setZoom(5);
                //self.createDinoMarkers(self.dinoList);
                //self.newDinoMarker();
                personMarker = new google.maps.Marker({
                    map: map,
                    position: loc,
                    icon: 'img/manSm.png'
                });
                self.location("");

                // this indicates that the user's icon is displayed
                person = true;
                return loc;
            }
            else {
                //could not find location based on search
                //self.locationError(true);
                return self.startLoc;
            }
        });
    });

    self.buttonText = ko.observable("Show All Dinos!");



    self.toggleAllDinos = function(){
        self.reset();
        if (self.buttonText() == "Show All Dinos!") {
            self.display(self.allDinoMarkers());
            self.buttonText("Hide All Dinos!");
        }
    };

    self.toggleDinos = function() {
        switch (arguments[0]) {
            case "omnivore":
                var markers = self.omnivoreMarkers();
                self.display(markers);
                break;
            case "carnivore":
                var markers = self.carnivoreMarkers();
                self.display(markers);
                break;
            case "herbivore":
                var markers = self.herbivoreMarkers();
                self.display(markers);
                break;
            case "all":

                break;
        }
    }
    self.display = function(markers) {
        self.closeInfobox();
        if (markers[0].visible == false || markers[2].visible == false) {
            for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            marker.setVisible(true);
            }
        } else if (markers[0].visible == true || markers[2].visible == true) {
            for (var i = 0; i < markers.length; i++){
            var marker = markers[i];
            marker.setVisible(false);
            }
        }
    };
  
    self.reset = function(){
        self.closeInfobox();
        var markers = self.allDinoMarkers();
        var i = 0;
        for (; i < markers.length; i++) {
            markers[i].setVisible(false);
        }
    };

    self.closeInfobox = function() {
//        if (self.infoWindow()) {
//            self.infoWindow().close();
//        }
    };

    self.displayThisDino = function() {
        self.reset();
        self.closeInfobox();
        var name = arguments[0].name();
        var markers = self.allDinoMarkers();
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            if (name == marker.title) {
                marker.setVisible(true);
                console.log(name);
            }
        }
    };

// set initial state of instructions. Temporarily all true for styling.
    self.inputInstruction = true;
    self.filterInstruction = true;
    self.listInstruction = true;
    self.clickList = true;
    self.showForm = true;

    self.nextInstruction = function(){
    // write a function that will toggle truthiness of each property after click.
    };
// Obviously, rewrite with ternary operator
    self.showLegend = function() {
        if (self.inputInstruction) {
            return false;
        } else {
            return true;
        }
    };

    self.init();
};

ko.applyBindings( new ViewModel() );