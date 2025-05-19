
// const fs = require('fs');

const urlBase = 'https://gitlab.kitware.com/cmake/cmake/-/blob/master/'

var totalScore = 0;
var seenFiles = new Set();
var codeData;
let aggregateMetrics = {
    "averageScore": 0,
    "funcCount" : 0,
    "loc" : 0,
    "fileCount" : 0,
    "highestScore" : {
      "value": 0,
      "function" : "",
    },
    "lowestScore": {
      "value": 1000,
      "function" : "",
    },
    "longestFunction": {
      "value": 0,
      "function" : "",
    },
    "branchCount": {
      "value": 0,
      "function" : "",
    },
}

// const data = fs.readFileSync('clang-tidy-metrics.json', 'utf-8');
const cm = document.getElementById('codeMetrics');
// cm.style.width = "1400px";
// cm.style.height = "900px";
const fi =  document.createElement('input')
fi.type='file'
fi.id = "fileInput";
// fi.style.width = "200px";
// fi.style.height = "20px";
// fi.style.position = "absolute";
// fi.style.top = "10";
// fi.style.left = "20";

fi.addEventListener('change', (event) => {
  const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target.result;
        // Process the file content
        render(content);
      };
      reader.onerror = (e) => {
        console.error("File reading error:", e);
      }
      reader.readAsText(file);
    }
});

cm.appendChild(fi);

function render(content) {
  codeData = parseMetricJson(JSON.parse(content));
  aggregateMetrics.averageScore = totalScore / codeData.length;
  aggregateMetrics.fileCount = seenFiles.size;
  displayCodeInfo(codeData, 'codeMetrics');
}

function displayCodeInfo(codeArray, containerId) {
  // Get the container element where we'll add the code information
  const container = document.getElementById(containerId);

  // Check if the container element exists
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found.`);
    return;
  }
  // Add a baseline metrics box
  const overallMetrics = document.createElement('div');
  overallMetrics.classList.add('box');
  overallMetrics.id = "overallMetrics"
  for (item in aggregateMetrics) {
    // container for each metric
    var metric = document.createElement('div');
    metric.classList.add('code-metric-overview');

    // metric name
    var name = document.createElement('div');
    name.classList.add('overall-metrics-name');
    var nameText = document.createTextNode(item);
    name.appendChild(nameText);

    if (typeof aggregateMetrics[item] === 'object') {
      // Function name
      var funcName = document.createElement('div');
      funcName.classList.add('overall-metrics-function-name');
      var funcNameText = document.createTextNode(aggregateMetrics[item].function);
      funcName.appendChild(funcNameText)

      // Ref to rest of functions stats
      var ref = document.createElement('a');
      ref.classList.add('overall-metrics-link')
      ref.href = '#' + aggregateMetrics[item].function + '-metrics';
      ref.appendChild(funcName);
    }

    // Metric Value
    var value = document.createElement('div');
    value.classList.add('overall-metrics-value');
    value.innerHTML = aggregateMetrics[item].value;

    // Add sub info to metric box
    metric.appendChild(name)
    metric.appendChild(value);
    if (typeof aggregateMetrics[item] === 'object' ) {
      metric.appendChild(ref);
    }
    // add metric box to box of metrics
    overallMetrics.appendChild(metric);
  }
  // Add box of metrics to parent element
  container.appendChild(overallMetrics);

  // Iterate over each item in the metrics
  codeArray.forEach(item => {
    // Create a new div element for each entry
    const codeElement = document.createElement('div');
    codeElement.classList.add('code-info-item');
    codeElement.id = item["name"] + "-metrics"

    const codeLineElement = document.createElement('pre');
    codeLineElement.textContent = item["code-line"];

    var scoreColor = getColor("#00FF00", "#FF0000", 0, 100, item["cognitive-complexity"]);
    codeLineElement.style.color = scoreColor;
    const codeLineElementRef = document.createElement('a');
    var href = item["location"].split(":").slice(0,1).join("#");
    codeLineElementRef.href = urlBase + href;
    codeLineElementRef.appendChild(codeLineElement);
    codeElement.appendChild(codeLineElementRef);
    const statsElement = document.createElement('ul');
    statsElement.classList.add('code-stats');
    for (const key in item) {
      if (key != "code-line") {
        const listItem = document.createElement('li');
        listItem.textContent = item[key];
        statsElement.appendChild(listItem);
      }
      codeElement.appendChild(statsElement);
    }
    // Append the created code element to the container
    container.appendChild(codeElement);
  });
}

function parseMetricJson(data) {
  var parsedCodeData = [];
  for(var item of data) {
    if ("cognitive-complexity" in item) {
      totalScore += item["cognitive-complexity"];
      aggregateMetrics.funcCount += 1;
      var location = item["location"].split(":")[0];
      seenFiles.add(location);
      aggregateMetrics.loc += item["num-lines"];
      var cogComplexity = item["cognitive-complexity"];
      var numBranches = item["num-branches"];
      var funLen = item["num-statements"];
      // highest score
      if ( cogComplexity > aggregateMetrics.highestScore.value) {
        aggregateMetrics.highestScore.value = cogComplexity;
        aggregateMetrics.highestScore.function = item["name"];
      }
      // lowest score
      if (cogComplexity <aggregateMetrics.lowestScore.value ) {
        aggregateMetrics.lowestScore.value = cogComplexity;
        aggregateMetrics.lowestScore.function = item["name"];
      }
      // longest function
      if (funLen > aggregateMetrics.longestFunction.value) {
        aggregateMetrics.longestFunction.value = funLen;
        aggregateMetrics.longestFunction.function = item["name"];
      }
      // most branches
      if (numBranches > aggregateMetrics.branchCount.value) {
        aggregateMetrics.branchCount.value = numBranches;
        aggregateMetrics.branchCount.function = item["name"];
      }
      parsedCodeData.push(item);
    }
  }
  return parsedCodeData;
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function map(value, fromSource, toSource, fromTarget, toTarget) {
  return (value - fromSource) / (toSource - fromSource) * (toTarget - fromTarget) + fromTarget;
}
// inspired by https://stackoverflow.com/a/46543292
function getColor(startcolor, endcolor, min, max, value) {
  var startRGB = hexToRgb(startcolor);
  var endRGB = hexToRgb(endcolor);
  var percentFade = map(value, min, max, 0, 1);

  var diffRed = endRGB.r - startRGB.r;
  var diffGreen = endRGB.g - startRGB.g;
  var diffBlue = endRGB.b - startRGB.b;

  diffRed = (diffRed * percentFade) + startRGB.r;
  diffGreen = (diffGreen * percentFade) + startRGB.g;
  diffBlue = (diffBlue * percentFade) + startRGB.b;

  var result = "rgb(" + Math.round(diffRed) + ", " + Math.round(diffGreen) + ", " + Math.round(diffBlue) + ")";
  return result;
}

function createSortSelector(containerId, sortOptions, onSortChange) {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Container element with ID "${containerId}" not found.`);
    return;
  }

  const label = document.createElement('label');
  label.textContent = 'Sort by: ';
  container.appendChild(label);

  const select = document.createElement('select');
  select.addEventListener('change', (event) => {
    const sortBy = event.target.value;
    onSortChange(sortBy); // Call the provided event handler with the selected value
  });

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select an option';
  select.appendChild(defaultOption);

  for (const key in sortOptions) {
    if (sortOptions.hasOwnProperty(key)) {
      const option = document.createElement('option');
      option.value = sortOptions[key][0];
      option.textContent = sortOptions[key][1];
      select.appendChild(option);
    }
  }

  container.appendChild(select);
}

// Example Usage:
const sortOptions = {
  cogComplexity: ['cogitive-complexity','Cognitive Complexity'],
  numlines: ['num-lines', 'Number of Lines'],
  numstatements: ['num-statements', 'Number of Statements'],
  numbranches: ['num-branches', 'Number of Branches'],
  numparameters: ['num-parameters', 'Number of Parameters'],
  nestinglvl: ['nesting-level', 'Nesting Level'],
  numvariables: ['num-variables', 'Number of Variables']
};

function handleSort(sortByCriteria) {
  document.getElementById('codeMetrics').innerHTML = '';
  codeData = sortArrayOfObjects(codeData, sortByCriteria, 'dsc');
  displayCodeInfo(codeData, 'codeMetrics');
}

document.addEventListener('DOMContentLoaded', () => {
  createSortSelector('sortControls', sortOptions, handleSort);
});

function sortArrayOfObjects(arr, key, direction = 'asc') {
  if (!Array.isArray(arr)) {
    console.error("Input must be an array.");
    return arr; // Or throw an error
  }

  if (arr.length === 0) {
    return [];
  }

  if (typeof arr[0] !== 'object' || arr[0] === null || !(key in arr[0])) {
    console.error("Array elements must be non-null objects containing the specified key.");
    return arr; // Or throw an error
  }

  const sortedArray = [...arr]; // Create a copy to avoid modifying the original array

  sortedArray.sort((a, b) => {
    const valueA = a[key];
    const valueB = b[key];

    let comparison = 0;

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      comparison = valueA.localeCompare(valueB);
    } else if (typeof valueA === 'number' && typeof valueB === 'number') {
      comparison = valueA - valueB;
    } else if (valueA > valueB) {
      comparison = 1;
    } else if (valueA < valueB) {
      comparison = -1;
    }

    return direction === 'asc' ? comparison : comparison * -1;
  });

  return sortedArray;
}

