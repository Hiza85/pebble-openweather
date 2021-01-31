var ajax    = require( 'ajax' );
var UI      = require( 'ui' );
var Vector2 = require( 'vector2' );

var config = require( './config.json' );

var v_splashScreen = new UI.Card({
    title:           'OpenWeather\n\n',
    titleColor:      '#e96e4c',
    banner:          'IMAGE_LOGO_SPLASH',
    backgroundColor: 'black'
});
v_splashScreen.show();

function show_error( pi_texte ) {
    v_splashScreen.hide();

    var v_err = new UI.Card({
        title:           'Erreur\n\n',
        titleColor:      'red',
        body:            pi_texte,
        scrollable:      true
    });

    v_err.show();
}

var v_locationOption = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000
};

function locationSuccess( pos ) {
  ajax(
    {
      url: 'https://api.openweathermap.org/data/2.5/onecall?lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude + '&exclude=minutely,daily,alert&units=metric&lang=fr&appid=' + config.APIKEY,
      type: 'text'
    },
    function( data ) {
      show_weather( JSON.parse( data ), pos.coords.latitude, pos.coords.longitude );
    },
    function( err ) {
      show_error( "OpenWeather error: " + err );
    }
  );
}

function locationError( err ) {
  if( err.code == err.PERMISSION_DENIED )
    show_error( 'Location acces was denied by the user' );
  else
    show_error( 'Location error (' + err.code +'): ' + err.message );
}

function windDirection( pi_degree ) {
    if( pi_degree > 337.5 )
      return 'N';

    if( pi_degree > 292.5 )
      return 'NW';

    if( pi_degree > 247.5 )
      return 'W';

    if( pi_degree > 202.5 )
      return 'SW';

    if( pi_degree > 157.5 )
      return 'S';

    if( pi_degree > 122.5 )
      return 'SE';

    if( pi_degree > 67.5 )
      return 'E';

    if( pi_degree > 22.5 )
      return 'NE';

    return 'N';
}

function show_weather( v_data, pi_lat, pi_long ) {

  // Longueur: 144
  // Hauteur : 168

  var infowindow = new UI.Window();
  var v_desc_y   = 45;
  var v_color;
  var v_offset_temp;  // Vertical position for temperature, according to text information

  // Degre
  var v_degree = new UI.Text({
    position: new Vector2(0, 0),
    size: new Vector2(100, 35),
    text : v_data.current.temp + '°',
    font: 'Gothic 28',
    color: 'white',
    textAlign: 'left'
  });
  infowindow.add(v_degree);

  // Name
  ajax(
    {
      url: 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + pi_lat + '&longitude=' + pi_long + '&localityLanguage=fr',
      type: 'text'
    },
    function( data ) {
      v_maps = JSON.parse( data );

      var v_lieu = "";
      if( v_maps.city != "" )
        v_lieu = v_maps.city;
      if( v_maps.locality != "" && v_maps.locality != v_maps.city ) {
        if( v_lieu == "" )
          v_lieu = v_maps.locality;
        else
          v_lieu += " " + v_maps.locality;
      }

      // Nom géolocalisé
      var v_name = new UI.Text({
        position: new Vector2(0, 10),
        size: new Vector2(144, 20),
        text : v_lieu,
        font: 'Gothic 14',
        color: 'white',
        textAlign: 'right'
      });
      infowindow.add(v_name);
    }
  );

  // Description
  var v_description = new UI.Text({
    position: new Vector2(0, 30),
    size: new Vector2(144, 20),
    text : v_data.current.weather[0].description.charAt(0).toUpperCase() + v_data.current.weather[0].description.slice(1),
    font: 'Gothic 14',
    color: 'white',
    textAlign: 'left'
  });
  infowindow.add(v_description);

  // Vent
  if( v_data.current.wind_speed > 0 ) {
    var v_description = new UI.Text({
      position: new Vector2(0, v_desc_y),
      size: new Vector2(144, 20),
      text : "Vent: " + Math.round( v_data.current.wind_speed * 18 / 5 * 100 ) / 100 + 'km/h ' + windDirection( v_data.current.wind_deg ),
      font: 'Gothic 14',
      color: 'white',
      textAlign: 'left'
    });
    infowindow.add(v_description);

    v_desc_y += 15;
  }

  // Nuage
  if( v_data.current.clouds > 0 ) {
    var v_description = new UI.Text({
      position: new Vector2(0, v_desc_y),
      size: new Vector2(144, 20),
      text : "Nuage: " + v_data.current.clouds + '%',
      font: 'Gothic 14',
      color: 'white',
      textAlign: 'left'
    });
    infowindow.add(v_description);

    v_desc_y += 15;
  }

  // UV
  if( v_data.current.uvi > 0 ) {
    var v_description = new UI.Text({
      position: new Vector2(0, v_desc_y),
      size: new Vector2(144, 20),
      text : "UV: " + v_data.current.uvi,
      font: 'Gothic 14',
      color: 'white',
      textAlign: 'left'
    });
    infowindow.add(v_description);

    v_desc_y += 15;
  }

  v_offset_temp = 140 - v_desc_y - 5;

  // Graphe
  var element = new UI.Line({
    position: new Vector2(18, 140),
    position2: new Vector2(126, 140),
    strokeColor: '#bfc9cc',
  });
  infowindow.add(element);

  // Températeur maximum pour définir l'échelle
  var v_temp_max = Math.max( v_data.hourly[1].temp, v_data.hourly[2].temp, v_data.hourly[3].temp, v_data.hourly[4].temp, v_data.hourly[5].temp, v_data.hourly[6].temp );
  var v_temp_min = Math.min( v_data.hourly[1].temp, v_data.hourly[2].temp, v_data.hourly[3].temp, v_data.hourly[4].temp, v_data.hourly[5].temp, v_data.hourly[6].temp );
  // Arrondi à la dizaine sup pour garder une marge
  var v_temp_max_sup = Math.ceil( Math.abs( v_temp_max ) / 10 ) * 10;

  var v_rain_snow_max = 0;
  for( i = 1; i <= 6; i++ ) {
    var v_rain = 0;
    var v_snow = 0;

    if( v_data.hourly[i].hasOwnProperty( 'rain' ) )
      v_rain = v_data.hourly[i].rain["1h"];
    if( v_data.hourly[i].hasOwnProperty( 'snow' ) )
      v_snow = v_data.hourly[i].snow["1h"];

    // Pluie
    if( v_rain > 0 ) {
      if( v_rain > v_rain_snow_max )
        v_rain_snow_max = v_rain;

      var element = new UI.Rect({
        position: new Vector2(i * 18, 140 - v_rain * 20),
        size: new Vector2(18, v_rain * 20),
        backgroundColor: '#35aedc',
        borderColor: '#1e637c',
      });
      infowindow.add(element);
    }

    // Neige
    if( v_snow > 0 ) {
      if( v_snow > v_rain_snow_max )
        v_rain_snow_max = v_snow;

      var element = new UI.Rect({
        position: new Vector2(i * 18, 140 - v_snow * 20),
        size: new Vector2(9, v_snow * 20),
        backgroundColor: '#8addfd',
        borderColor: '#8addfd',
      });
      infowindow.add(element);
    }

    // Temperature
    if( v_data.hourly[i].temp < 0 )
      v_color = '#78d1ec';
    else
      v_color = '#ff0000';

    var element = new UI.Line({
      position: new Vector2(i * 18, 140 - v_data.hourly[i].temp * v_offset_temp / v_temp_max_sup),
      position2: new Vector2(( i + 1 ) * 18, 140 - v_data.hourly[i + 1].temp * v_offset_temp / v_temp_max_sup),
      strokeWidth: 3,
      strokeColor: v_color,
    });
    infowindow.add(element);

    // Echelle des heures
    // Noter les Temperature max et min
    var v_description = new UI.Text({
      position: new Vector2(i * 18 + 6, 140),
      size: new Vector2(20, 20),
      text : i,
      font: 'Gothic 14',
      color: 'white',
      textAlign: 'left'
    });
    infowindow.add(v_description);
  }

  // Noter les Temperature max et min
  var v_description = new UI.Text({
    position: new Vector2(0, 130 - v_temp_max * v_offset_temp / v_temp_max_sup),
    size: new Vector2(20, 20),
    text : Math.round( v_temp_max ) + '°',
    font: 'Gothic 14',
    color: 'white',
    textAlign: 'left'
  });
  infowindow.add(v_description);

  // Echelle précipitations
  if( v_rain_snow_max > 0 ) {
    do {
      var v_description = new UI.Text({
        position: new Vector2(130, 128 - v_rain_snow_max * 20),
        size: new Vector2(20, 20),
        text : v_rain_snow_max.toFixed( 1 ),
        font: 'Gothic 14',
        color: '#78d1ec',
        textAlign: 'left'
      });
      infowindow.add(v_description);

      v_rain_snow_max -= 2;
      v_rain_snow_max  = Math.round( v_rain_snow_max );
    } while( v_rain_snow_max >= 0 );
  }

  var v_pos_min = 130 - v_temp_min * v_offset_temp / v_temp_max_sup;
  // Décaller pour ne pas superpositionner le texte
  if( v_pos_min - ( 130 - v_temp_max * v_offset_temp / v_temp_max_sup ) < 15 )
    v_pos_min += 15;

  if( Math.round( v_temp_min ) != Math.round( v_temp_max ) ) {
    var v_description = new UI.Text({
      position: new Vector2(0, v_pos_min),
      size: new Vector2(20, 20),
      text : Math.round( v_temp_min ) + '°',
      font: 'Gothic 14',
      color: 'white',
      textAlign: 'left'
    });
    infowindow.add(v_description);
  }

  // Scrollable si nécessaire
  if( v_pos_min > 160 )
    infowindow.scrollable( true );

  v_splashScreen.hide();
  infowindow.show();
}

navigator.geolocation.getCurrentPosition( locationSuccess, locationError, v_locationOption );
