const infected = document.getElementById('infected');
const deaths = document.getElementById('deaths');
const recovered = document.getElementById('recovered');
var data_control = document.getElementById('data_control');
var st_total_cases, st_total_deaths, st_total_recovered;
var new_daily_cases = 0;
var new_daily_deaths = 0;
var new_daily_recovered = 0;
var daily_cases = new Set();
var daily_deaths = [];
var daily_recovered = [];
var graph = document.getElementById('graph');
fetch(
  'https://agile-meadow-78327.herokuapp.com/api.thevirustracker.com/free-api?global=stats'
)
  .then((res) => res.json())
  .then((res) => {
    graph.style.display = 'none';
    var data = res.data.results[0];
    st_total_cases = data.total_cases;
    st_total_deaths = data.total_deaths;
    st_total_recovered = data.total_recovered;
    infected.innerHTML = `${data.total_cases}`;
    deaths.innerHTML = `${data.total_deaths}`;
    recovered.innerHTML = `${data.total_recovered}`;
  })
  .catch((err) => console.log(err));

am4core.ready(function () {
  // Themes begin
  am4core.useTheme(am4themes_animated);
  // Themes end

  var continents = {
    AF: 0,
    AN: 1,
    AS: 2,
    EU: 3,
    NA: 4,
    OC: 5,
    SA: 6,
  };
  // Create map instance
  var chart = am4core.create('chartdiv', am4maps.MapChart);
  chart.projection = new am4maps.projections.Miller();

  // Create map polygon series for world map
  var worldSeries = chart.series.push(new am4maps.MapPolygonSeries());
  worldSeries.useGeodata = true;
  worldSeries.geodata = am4geodata_worldLow;

  var worldPolygon = worldSeries.mapPolygons.template;
  worldPolygon.tooltipText = '{name}';
  worldPolygon.nonScalingStroke = true;
  worldPolygon.strokeOpacity = 0.5;
  worldPolygon.fill = am4core.color('#8395A7');
  worldPolygon.propertyFields.fill = '#F9DDA4';

  var hs = worldPolygon.states.create('hover');
  hs.properties.fill = chart.colors.getIndex(9);

  // Create country specific series (but hide it for now)
  var countrySeries = chart.series.push(new am4maps.MapPolygonSeries());
  countrySeries.useGeodata = true;
  countrySeries.hide();
  countrySeries.geodataSource.events.on('done', function (ev) {
    worldSeries.hide();
    countrySeries.show();
  });

  var countryPolygon = countrySeries.mapPolygons.template;
  countryPolygon.tooltipText = '{name}';
  countryPolygon.nonScalingStroke = true;
  countryPolygon.strokeOpacity = 0.5;
  countryPolygon.fill = am4core.color('#0A3D62');

  var hs = countryPolygon.states.create('hover');
  hs.properties.fill = chart.colors.getIndex(9);

  //State-Series
  var stateSeries = chart.series.push(new am4maps.MapPolygonSeries());
  stateSeries.useGeodata = true;
  stateSeries.hide();
  stateSeries.geodataSource.events.on('done', function (ev) {
    worldSeries.hide();
    countrySeries.hide();
    stateSeries.show();
  });

  var statePolygon = stateSeries.mapPolygons.template;
  statePolygon.tooltipText = '{name}';
  statePolygon.nonScalingStroke = true;
  statePolygon.strokeOpacity = 0.5;
  statePolygon.fill = am4core.color('blue');

  var country;
  // Set up click events
  worldPolygon.events.on('hit', function (ev) {
    ev.target.series.chart.zoomToMapObject(ev.target);
    var map = ev.target.dataItem.dataContext.map;
    data_control.innerHTML = `${ev.target.dataItem._dataContext.name} Data`;
    if (map) {
      country = ev.target.dataItem._dataContext.name;
      ev.target.isHover = true;
      countrySeries.geodataSource.url =
        'https://www.amcharts.com/lib/4/geodata/json/' + map + '.json';

      fetch(
        'https://agile-meadow-78327.herokuapp.com/api.covid19api.com/summary'
        //`https://agile-meadow-78327.herokuapp.com/api.thevirustracker.com/free-api?countryTimeline=${ev.target.dataItem._dataContext.name}`
      )
        .then((res) => res.json())
        .then((res) => {
          const obj = res.data.Countries;
          var data = obj.filter(
            (value) => value.CountryCode === ev.target.dataItem._dataContext.id
          );
          infected.innerHTML = `${data[0].TotalConfirmed}`;
          deaths.innerHTML = `${data[0].TotalDeaths}`;
          recovered.innerHTML = `${data[0].TotalRecovered}`;
        })
        .catch((err) => console.log(err));

      fetch(
        `https://agile-meadow-78327.herokuapp.com/api.covid19api.com/dayone/country/${ev.target.dataItem._dataContext.name}/status/confirmed`
      )
        .then((res) => res.json())
        .then((res) => {
          //daily_cases = [];
          graph.style.display = 'block';
          var data = res.data;
          for (const key in data) {
            if (data.hasOwnProperty(key)) {
              const element = data[key];
              daily_cases.add(element.Cases);
            }
          }
          var xVal = 0;
          var dps = [];
          for (let value of daily_cases) {
            dps.push({
              x: xVal,
              y: value,
            });
            xVal++;
          }
          var chart = new CanvasJS.Chart('graph', {
            exportEnabled: true,
            title: {
              text: `${country} chart`,
            },
            data: [
              {
                type: 'spline',
                markerSize: 0,
                dataPoints: dps,
              },
            ],
          });
          chart.render();
        })
        .catch((err) => console.log(err));

      countrySeries.geodataSource.load();
    }
  });

  countryPolygon.events.on('hit', (ev) => {
    ev.target.series.chart.zoomToMapObject(ev.target);
    var map = ev.target.dataItem.dataContext.map;
    if (map) {
      country = map;
      ev.target.isHover = true;
      countrySeries.geodataSource.url =
        'https://www.amcharts.com/lib/4/geodata/json/' +
        country +
        map +
        '.json';
      var state = ev.target;

      statePolygon.fill = am4core.color('black');
      countrySeries.geodataSource.load();
    }
  });

  // Set up data for countries
  var data = [];
  for (var id in am4geodata_data_countries2) {
    if (am4geodata_data_countries2.hasOwnProperty(id)) {
      var country = am4geodata_data_countries2[id];
      if (country.maps.length) {
        data.push({
          id: id,
          color: chart.colors.getIndex(continents[country.continent_code]),
          map: country.maps[0],
        });
      }
    }
  }
  worldSeries.data = data;

  // Zoom control
  chart.zoomControl = new am4maps.ZoomControl();

  var homeButton = new am4core.Button();
  homeButton.events.on('hit', function (event) {
    data_control.innerHTML = `World Data`;
    daily_cases.clear();
    graph.style.display = 'none';
    infected.innerHTML = `${st_total_cases}`;
    deaths.innerHTML = `${st_total_deaths}`;
    recovered.innerHTML = `${st_total_recovered}`;
    worldSeries.show();
    countrySeries.hide();
    chart.goHome();
  });

  homeButton.icon = new am4core.Sprite();
  homeButton.padding(7, 5, 7, 5);
  homeButton.width = 30;
  homeButton.icon.path =
    'M16,8 L14,8 L14,16 L10,16 L10,10 L6,10 L6,16 L2,16 L2,8 L0,8 L8,0 L16,8 Z M16,8';
  homeButton.marginBottom = 10;
  homeButton.parent = chart.zoomControl;
  homeButton.insertBefore(chart.zoomControl.plusButton);
});
