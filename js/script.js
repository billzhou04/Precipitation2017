const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

let prcpData = [];
let states = {};
let currentMonth = 1;

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
];

// const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
//     .domain([85, 0]);

const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 14]); // Adjust domain based on PRCP range

const tooltip = d3.select("#tooltip");

const stateAbbreviations = {
  AB: "Alberta",
  AK: "Alaska",
  AL: "Alabama",
  AR: "Arkansas",
  AZ: "Arizona",
  BC: "British Columbia",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  GU: "Guam",
  HI: "Hawaii",
  IA: "Iowa",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  MA: "Massachusetts",
  MB: "Manitoba",
  MD: "Maryland",
  ME: "Maine",
  MI: "Michigan",
  MN: "Minnesota",
  MO: "Missouri",
  MP: "Northern Mariana Islands",
  MS: "Mississippi",
  MT: "Montana",
  NB: "New Brunswick",
  NC: "North Carolina",
  ND: "North Dakota",
  NE: "Nebraska",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NL: "Newfoundland and Labrador",
  NM: "New Mexico",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NV: "Nevada",
  NY: "New York",
  OH: "Ohio",
  OK: "Oklahoma",
  ON: "Ontario",
  OR: "Oregon",
  PA: "Pennsylvania",
  PE: "Prince Edward Island",
  PR: "Puerto Rico",
  QC: "Quebec",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VA: "Virginia",
  VI: "Virgin Islands",
  VT: "Vermont",
  WA: "Washington",
  WI: "Wisconsin",
  WV: "West Virginia",
  WY: "Wyoming",
};

function init() {
  const choroplethMap = d3
    .select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  Promise.all([
    d3.csv("./data/wind_prcp_2017.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
  ])
    .then(([data, us]) => {
      prcpData = data.map((d) => ({
        state: stateAbbreviations[d.state] || d.state,
        month: +d.month,
        PRCP: +d.PRCP,
        WSF5: +d.WSF5,
      }));

      states = topojson.feature(us, us.objects.states);

      console.log(
        "TopoJSON State Names:",
        states.features.map((d) => d.properties.name)
      );
      console.log("CSV State Names:", [
        ...new Set(prcpData.map((d) => d.state)),
      ]);

      setupSlider();

      updateChoropleth(choroplethMap);
    })
    .catch((error) => console.error("Error loading data:", error));
}

function setupSlider() {
  const slider = d3
    .sliderHorizontal()
    .min(1)
    .max(9)
    .step(1)
    .width(width - 100)
    .displayValue(false)
    .on("onchange", (val) => {
      currentMonth = val;
      d3.select("#month-value").text(monthNames[val - 1]);
      updateChoropleth(d3.select("#vis g"));
    });

  d3.select("#slider")
    .append("svg")
    .attr("width", width)
    .attr("height", 70)
    .append("g")
    .attr("transform", "translate(30,30)")
    .call(slider);
}

function updateChoropleth(choroplethMap) {
  choroplethMap.selectAll("*").remove();

  choroplethMap
    .append("text")
    .attr("class", "map-title")
    .attr("x", width / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(
      `Average Precipitation by State - ${monthNames[currentMonth - 1]} 2017`
    );

  const projection = d3.geoAlbersUsa().fitSize([width, height], states);

  const path = d3.geoPath().projection(projection);

  const monthData = prcpData.filter((d) => d.month === currentMonth);

  const prcpByState = {};
  monthData.forEach((d) => {
    prcpByState[d.state] = d.PRCP;
  });

  console.log(
    `Precipitation Data for ${monthNames[currentMonth - 1]}:`,
    prcpByState
  );

  const wsf5ByState = {};
  monthData.forEach((d) => {
    wsf5ByState[d.state] = d.WSF5;
  });

  console.log(
    `Max Wind Data for ${monthNames[currentMonth - 1]}:`,
    wsf5ByState
  );

  choroplethMap
    .selectAll(".state")
    .data(states.features)
    .enter()
    .append("path")
    .attr("class", "state")
    .attr("d", path)
    .attr("fill", (d) => {
      const stateName = d.properties.name;
      const statePrcp = prcpByState[stateName];
      return statePrcp ? colorScale(statePrcp) : "#ccc";
    })
    .on("mouseover", function (event, d) {
      const stateName = d.properties.name;
      const statePrcp = prcpByState[stateName];
      const stateWsf5 = wsf5ByState[stateName];

      d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);

      tooltip
        .style("display", "block")
        .html(
          `
                    <strong>${stateName}</strong><br/>
                    Precipitation: ${
                      statePrcp ? statePrcp.toFixed(3) + " Inches" : "N/A"
                    }
                    <br/>
                    Max Wind Speed: ${
                      stateWsf5 ? stateWsf5.toFixed(1) + " mph" : "N/A"
                    }
                `
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);

      tooltip.style("display", "none");
    });
  addLegend();
}

function addLegend() {
  const legendWidth = 20;
  const legendHeight = 200;
  const legendX = 40; // Position on the left side
  const legendY = 50;
  const numSteps = 10; // Number of color gradient steps

  // Remove previous legend if it exists
  d3.select("#vis").select(".legend").remove();

  const legend = d3
    .select("#vis")
    .select("svg")
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX},${legendY})`);

  // Define a linear gradient for the legend
  const defs = legend.append("defs");

  const linearGradient = defs
    .append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%");

  // Create color stops for the gradient
  for (let i = 0; i <= numSteps; i++) {
    let t = i / numSteps;
    linearGradient
      .append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", colorScale(t * 27)); // Scale based on PRCP range
  }

  // Append legend rectangle
  legend
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)")
    .attr("stroke", "black");

  // Add labels to the legend
  const legendScale = d3.scaleLinear().domain([0, 27]).range([legendHeight, 0]);

  const legendAxis = d3
    .axisRight(legendScale)
    .ticks(5)
    .tickFormat(d3.format(".2f"));

  legend
    .append("g")
    .attr("transform", `translate(${legendWidth}, 0)`)
    .call(legendAxis);

  // Add legend title
  legend
    .append("text")
    .attr("x", -10)
    .attr("y", -10)
    .attr("text-anchor", "start")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Precipitation (inches)");
}

window.addEventListener("load", init);
