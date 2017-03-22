var pin = [];
var markersArray = [], bounds;
var myLat = 0, myLng = 0;
var bearing, distance;
var dataStatus = 0;

var client_id = "CS1PFH0RSIUYJGFWULLV2Z4R0OY3OYE2F5V5S4I2KQTGU02Q"; //https://foursquare.com/developers/apps
var client_secret = "1LRUAGIDHCLFPXRKAQHCJE1ZPRCTCHJEWO5GSRFIPBY2RVJF"; //https://foursquare.com/developers/apps

$(document).ready(function() {
    document.addEventListener("deviceready", onDeviceReady, false);
});

function onDeviceReady() {
    startCamera();
    setupMap();
    startAccelerometer();
    startCompass();
    startGeolocation();
    adMob();
}


function adMob() {
      document.removeEventListener('deviceready', onDeviceReady, false);

      // Set AdMobAds options:
      admob.setOptions({
        publisherId:          "ca-app-pub-8143291218601536~3236694409", 
        interstitialAdId:     "ca-app-pub-8143291218601536/6190160808",
      });

      // Start showing banners (atomatic when autoShowBanner is set to true)
      admob.createBannerView();

      // Request interstitial (will present automatically when autoShowInterstitial is set to true)
      admob.requestInterstitialAd();
    }



function getMarkers(lat,lng) {
    if(dataStatus != "ok"){
        clearMarkers();
        $.get( "https://api.foursquare.com/v2/venues/explore?ll="+lat+","+lng+"&radius=5000&client_id="+client_id+"&client_secret="+client_secret+"&v=20160930", function( response ) {
              var data = response.response.groups[0].items;
                  for(x=0;x<data.length;x++) {
                    var details = data[x].venue;
                    var categ = details.categories[0];
                    var lat = Number(details.location.lat);
                    var lng = Number(details.location.lng);
                      pin.push({
                        id: details.id,
                        name: details.name,
                        lat: lat,
                        lng: lng,
                        icon: categ.icon.prefix + '32' + categ.icon.suffix,
                        rating: details.rating
                      });
                  }
            })
        setTimeout(function(){
            loadData();
        }, 1000);
    }
}

function startCamera() {
    ezar.initializeVideoOverlay(
        function() {
            ezar.getBackCamera().start();
        },
        function(error) {
            //alert("ezar initialization failed");
        });
}

function setupMap(){
    $("#map").height($(window).height()-60);
    var mapOptions = {
        zoom: 9,
        mapTypeControl: false,
        streetViewControl: false,
        navigationControl: true,
        scrollwheel: false,
        styles: [{"featureType":"administrative","elementType":"labels.text","stylers":[{"color":"#ff8c00"}]},{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#fc6919"}]},{"featureType":"administrative","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"}]},{"featureType":"administrative.country","elementType":"labels.text","stylers":[{"color":"#000000"}]},{"featureType":"administrative.country","elementType":"labels.text.fill","stylers":[{"color":"#212121"}]},{"featureType":"administrative.country","elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#2aaee4"},{"visibility":"on"}]}] // change Google Map style, choose one: https://snazzymaps.com/explore, or create your own style
    };
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
}

function toggleView(){
    if($(".listView").is(":visible")){
        $(".listView").hide();
        $("#map").height($(window).height()-60);
        $(".mapView").fadeIn(
            function(){
                google.maps.event.trigger(map, "resize");
                map.fitBounds(bounds);});
        $("#maplist").html('<i class="material-icons">view_day</i>');
    } else {
        $(".mapView").hide();
        $(".listView").fadeIn();
        $("#maplist").html('<i class="material-icons">map</i>');
    }
}

function loadData(){
    dataStatus = "pending";
    markersArray = [];
    bounds = new google.maps.LatLngBounds();

    var icon = new google.maps.MarkerImage('***'); // custom marker address E.g.: http://cupon.party/api/img/markerMe.png
    var gpsMarker = new google.maps.Marker({position: new google.maps.LatLng(myLat, myLng), map: map, title: "My Position", icon:icon});
    bounds.extend(new google.maps.LatLng(myLat, myLng));
    markersArray.push(gpsMarker);

    for(var i=0; i< pin.length; i++){

        if(pin[i].rating) {
                rating = pin[i].rating;
                ratingpadding = "5";
            } else {
                rating = "";
                ratingpadding = "0";
            }

        $(".listItems").append('<div class="item" onclick="venueInfo(\''+pin[i].id+'\')">'+'<div class="iconimg"><img src="'+pin[i].icon+'" ></div><p>'+pin[i].name+'</p><div class="listrating" style="padding: '+ratingpadding+'px">'+rating+'</div></div>');
        addMarker(i);
        relativePosition(i);
    }
    map.fitBounds(bounds);
    google.maps.event.trigger(map, "resize");
    dataStatus = "ok";
}

function addMarker(i){
    if(pin[i].rating) {
                rating = pin[i].rating;
                ratingpadding = "5";
            } else {
                rating = "";
                ratingpadding = "0";
            }
    marker = new RichMarker({
          position: new google.maps.LatLng(pin[i].lat, pin[i].lng),
          map: map,
          draggable: false,
          shadow: false,
          content: '<div class="namecontainer">'+'<div class="rating" style="padding:'+ ratingpadding +'px;">'+rating+'</div><div class="iconimg"><img src="'+pin[i].icon+'"></div> <div class="details">'+pin[i].name+'</div>'
          });
    google.maps.event.addListener(marker, 'click', function() {
        venueInfo(pin[i].id);
    });
}

function clearMarkers() {
    while (markersArray.length) {
        markersArray.pop().setMap(null);
    }
}

function relativePosition(i){
    var pinLat = pin[i].lat;
    var pinLng = pin[i].lng;
    var dLat = (myLat-pinLat)* Math.PI / 180;
    var dLon = (myLng-pinLng)* Math.PI / 180;
    var lat1 = pinLat * Math.PI / 180;
    var lat2 = myLat * Math.PI / 180;
    var y = Math.sin(dLon) * Math.cos(lat2);
    var x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = bearing + 180;
    pin[i]['bearing'] = bearing;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    distance = 3958.76  * c;
    pin[i]['distance'] = distance;
}

function calculateDirection(degree){
    var detected = 0;
    $("#spot").html("");
    for(var i=0;i<pin.length;i++){
        if(Math.abs(pin[i].bearing - degree) <= 20){
            var away, fontSize, fontColor, width, height, color, rating, ratingpadding;
            if(pin[i].distance>1.5){
                away = Math.round(pin[i].distance);
                if(away == 1) {
                    awaytitle = "mile";
                } else {
                    awaytitle = "miles";
                }
                fontSize = "11";
                fontColor = "#fafafa";
                imgSize = "30";
                color = "#8e44ad";
            } else if(pin[i].distance>0.5){
                away = Math.round(pin[i].distance);
                if(away == 1) {
                    awaytitle = "mile";
                } else {
                    awaytitle = "miles";
                }
                fontSize = "13";
                fontColor = "#fff";
                imgSize = "30";
                color = "#16a085";
            } else {
                away = pin[i].distance.toFixed(2);
                if(away == 1) {
                    awaytitle = "mile";
                } else {
                    awaytitle = "miles";
                }
                fontSize = "15";
                fontColor = "#fff";
                imgSize = "40";
                color = "#2980b9";
            }
            if(pin[i].rating) {
                rating = pin[i].rating;
                ratingpadding = "5";
            } else {
                rating = "";
                ratingpadding = "0";
            }
            $("#spot").append('<div class="namecontainer" data-id="'+i+'" style="margin-left:'+(((pin[i].bearing - degree) * 5)+50)+'px;background-color:'+color+';font-size:'+fontSize+'px;color:'+fontColor+'">'+'<div class="rating" style="padding:'+ ratingpadding +'px;">'+rating+'</div><div class="iconimg"><img width="'+imgSize+'px" src="'+pin[i].icon+'" ></div> <div class="details">'+pin[i].name+' <div class="dist"> '+ away + ' ' + awaytitle + ' away </div></div></div>');
            detected = 1;
        } else {
            if(!detected){
                $("#spot").html("");
            }
        }
    }
}


function venueInfo(id) {
    $.get( "https://api.foursquare.com/v2/venues/"+id+"?client_id="+client_id+"&client_secret="+client_secret+"&v=20160930", function( response ) {
              var data = response.response.venue;
              if(data.rating)  {
                rating = data.rating;
                ratingColor = data.ratingColor;
                signals = data.ratingSignals;
              } else {
                rating = '0';
                ratingColor = 'ddd';
                signals = '0';
              }
                  $('#overlay').fadeIn();
                  $('.infoModal').fadeIn();
                  $('.infoModal').html('<a onclick="closeVenueInfo()"><i class="material-icons close">close</i></a><h3>'+data.name+'</h3><p>'+data.location.formattedAddress+'</p><div class="ratingandlikes" style="background-color:#'+ratingColor+';"><i class="material-icons fav">favorite</i><p>'+data.likes.summary+' - Rating: '+rating+' from '+signals+' ratings</p></div>');
            });
}

function closeVenueInfo() {
    $('#overlay').fadeOut();
    $('.infoModal').fadeOut();
    $('.infoModal').html('');
}

function startGeolocation(){
    var options = { timeout: 30000 };
    watchGeoID = navigator.geolocation.watchPosition(onGeolocationSuccess, onGeolocationError, options);
}

function stopGeolocation() {
    if (watchGeoID) {
        navigator.geolocation.clearWatch(watchGeoID);
        watchGeoID = null;
    }
}

function onGeolocationSuccess(position) {
    myLat = position.coords.latitude;
    myLng = position.coords.longitude;
    getMarkers(myLat,myLng);

}

function onGeolocationError() {

}

function startCompass() {
    var options = { frequency: 100 };
    watchCompassID = navigator.compass.watchHeading(onCompassSuccess, onCompassError, options);
}

function stopCompass() {
    if (watchCompassID) {
        navigator.compass.clearWatch(watchCompassID);
        watchCompassID = null;
    }
}

function onCompassSuccess(heading) {
    var directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    var direction = directions[Math.abs(parseInt((heading.magneticHeading) / 45) + 1)];
    document.getElementById('direction').innerHTML = direction;
    var degree = heading.magneticHeading;
    if($("#arView").is(":visible") && dataStatus != "loading"){
        calculateDirection(degree);
    }
}

function onCompassError(compassError) {

}

function startAccelerometer() {
    var options = { frequency: 100 };
    watchAccelerometerID = navigator.accelerometer.watchAcceleration(onAccelerometerSuccess, onAccelerometerError, options);
}

function stopAccelerometer() {
    if (watchAccelerometerID) {
        navigator.accelerometer.clearWatch(watchAccelerometerID);
        watchAccelerometerID = null;
    }
}

function onAccelerometerSuccess(acceleration) {
    if(acceleration.y > 6){
        ezar.getBackCamera().start();
        $("#arView").fadeIn('slow');
        $("#topView").fadeOut();
        document.getElementById('body').style.background = "transparent";
    } else {
        ezar.getBackCamera().stop();
        $("#arView").fadeOut();
        $("#topView").fadeIn('slow');
        document.getElementById('body').style.background = "#fff";
    }
}

function onAccelerometerError() {

}
