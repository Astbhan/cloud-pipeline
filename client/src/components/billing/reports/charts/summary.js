/*
 * Copyright 2017-2019 EPAM Systems, Inc. (https://www.epam.com/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import {observer} from 'mobx-react';
import Chart from './base';
import {
  SummaryChart,
  DataLabelPlugin,
  PointDataLabelPlugin,
  VerticalLinePlugin
} from './extensions';
import {colors} from './colors';
import Export from '../export';
import {costTickFormatter} from '../utilities';
import {getTickFormat, getCurrentDate} from '../periods';
import moment from 'moment-timezone';

const Display = {
  accumulative: 'accumulative',
  fact: 'fact'
};

function dataIsEmpty (data) {
  return !data || data.filter((d) => !isNaN(d)).length === 0;
}

function generateEmptySet (filters) {
  if (!filters) {
    return null;
  }
  const {
    start: initial,
    end
  } = filters;
  const emptySet = [];
  let start = moment(initial);
  let unit = 'day';
  if (getTickFormat(initial, end) === '1M') {
    unit = 'M';
  }
  while (start <= end) {
    emptySet.push({
      dateValue: moment(start),
      key: moment(start).format('YYYY-MM-DD')
    });
    start = start.add(1, unit);
  }
  return emptySet;
}

function fillSet (filters, data) {
  const set = generateEmptySet(filters);
  if (!set || !set.length || !data || !data.length) {
    return data;
  }
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const key = item.dateValue.format('YYYY-MM-DD');
    const [index] = set
      .map(({key}, index) => ({key, index}))
      .filter(e => e.key === key)
      .map(e => e.index);
    if (index >= 0) {
      set.splice(index, 1, item);
    }
  }
  set.forEach(e => delete e.key);
  return set;
}

function generateLabels (data, filters = {}) {
  if (!data || !data.length) {
    return {labels: []};
  }
  const {
    start,
    end
  } = filters;
  const currentDate = getCurrentDate();
  let currentDateIndex;
  const checkUnit = (test, unit) => test.get(unit) === currentDate.get(unit);
  const checkUnits = (test, ...units) =>
    units.map(u => checkUnit(test, u)).reduce((r, c) => r && c, true);
  let isCurrentDateFn = (test) => checkUnits(test, 'Y', 'M', 'D');
  let format = 'DD MMM';
  let fullFormat = 'DD MMM YYYY';
  let tooltipFormat = 'MMMM DD, YYYY';
  let previousDateFn = date => moment(date).add(-1, 'M');
  if (getTickFormat(start, end) === '1M') {
    format = 'MMM';
    fullFormat = 'MMM YYYY';
    tooltipFormat = 'MMMM YYYY';
    isCurrentDateFn = (test) => checkUnits(test, 'Y', 'M');
    previousDateFn = date => moment(date).add(-1, 'Y');
  }
  const labels = [];
  let year;
  for (let i = 0; i < data.length; i++) {
    const date = data[i].dateValue;
    if (isCurrentDateFn(date)) {
      currentDateIndex = i;
    }
    let label = date.format(format);
    if (!year) {
      year = date.get('y');
    } else if (year !== date.get('y')) {
      year = date.get('y');
      label = date.format(fullFormat);
    }
    if (labels.indexOf(label) >= 0) {
      label = false;
    }
    labels.push({
      text: label,
      date,
      tooltip: date.format(tooltipFormat),
      previousTooltip: previousDateFn(date).format(tooltipFormat)
    });
  }
  return {
    labels,
    currentDateIndex
  };
}

function extractDataSet (data, title, type, color, options = {}) {
  if (dataIsEmpty(data)) {
    return false;
  }
  const {
    showPoints = true,
    currentDateIndex,
    borderWidth = 2,
    fill = false,
    borderColor = color,
    backgroundColor = 'transparent'
  } = options;
  return {
    [DataLabelPlugin.noDataIgnoreOption]: options[DataLabelPlugin.noDataIgnoreOption],
    label: title,
    type,
    data,
    fill,
    backgroundColor,
    borderColor,
    borderWidth,
    pointRadius: data.map((e, index) => showPoints && index === currentDateIndex ? 2 : 0),
    pointBackgroundColor: color,
    cubicInterpolationMode: 'monotone'
  };
}

function parse (values, quota) {
  const data = (values || [])
    .map(d => ({
      date: d.dateValue,
      value: d.value || NaN,
      cost: d.cost || NaN,
      previous: d.previous || NaN,
      previousCost: d.previousCost || NaN,
      quota: quota
    }));
  return {
    quota: data.map(d => d.quota),
    currentData: data.map(d => d.cost),
    previousData: data.map(d => d.previousCost),
    currentAccumulativeData: data.map(d => d.value),
    previousAccumulativeData: data.map(d => d.previous)
  };
}

function Summary (
  {
    title,
    style,
    summary,
    quota: showQuota = true,
    display = Display.accumulative
  }
) {
  const data = summary && summary.loaded
    ? fillSet(summary.filters, summary.value.values || [])
    : [];
  const quotaValue = showQuota && summary && summary.loaded
    ? summary.value.quota
    : undefined;
  const error = summary?.error;
  const {labels, currentDateIndex} = generateLabels(data, summary?.filters);
  const {
    currentData,
    previousData,
    currentAccumulativeData,
    previousAccumulativeData,
    quota
  } = parse(data, quotaValue);
  const disabled = currentData.length === 0 && previousData.length === 0;
  const loading = summary?.pending && !summary?.loaded;
  const dataConfiguration = {
    labels: labels.map(l => l.text),
    datasets: [
      display === Display.accumulative ? extractDataSet(
        currentAccumulativeData,
        'Current period',
        SummaryChart.current,
        colors.current,
        {currentDateIndex, borderWidth: 3}
      ) : false,
      display === Display.fact ? extractDataSet(
        currentData,
        'Current period (cost)',
        'bar',
        colors.current,
        {
          backgroundColor: colors.current,
          currentDateIndex,
          borderWidth: 1
        }
      ) : false,
      display === Display.accumulative ? extractDataSet(
        previousAccumulativeData,
        'Previous period',
        SummaryChart.previous,
        colors.previous,
        {currentDateIndex}
      ) : false,
      display === Display.fact ? extractDataSet(
        previousData,
        'Previous period (cost)',
        'bar',
        colors.previous,
        {
          backgroundColor: colors.previous,
          currentDateIndex,
          borderWidth: 1
        }
      ) : false,
      quotaValue ? extractDataSet(
        quota,
        'Quota',
        SummaryChart.quota,
        colors.quota,
        {
          showPoints: false,
          currentDateIndex,
          [DataLabelPlugin.noDataIgnoreOption]: true
        }
      ) : false
    ].filter(Boolean)
  };
  const options = {
    animation: {duration: 0},
    title: {
      display: !!title,
      text: title
    },
    scales: {
      xAxes: [{
        gridLines: {
          drawOnChartArea: false
        },
        ticks: {
          display: true,
          maxRotation: 45,
          callback: (date) => date || ''
        },
        offset: true
      }],
      yAxes: [{
        gridLines: {
          display: !disabled
        },
        ticks: {
          display: !disabled,
          callback: costTickFormatter
        }
      }]
    },
    legend: {
      display: false
    },
    tooltips: {
      intersect: false,
      mode: 'index',
      axis: 'x',
      filter: function ({yLabel}) {
        return !isNaN(yLabel);
      },
      callbacks: {
        title: function () {
          return undefined;
        },
        label: function (tooltipItem, data) {
          let {label, type} = data.datasets[tooltipItem.datasetIndex];
          const value = costTickFormatter(tooltipItem.yLabel);
          const {xLabel: defaultTitle, index} = tooltipItem;
          if (index >= 0 && index < labels.length) {
            const {tooltip, previousTooltip} = labels[index];
            if (type === SummaryChart.previous || label.toLowerCase().includes('previous')) {
              label = previousTooltip || defaultTitle;
            } else {
              label = tooltip || defaultTitle;
            }
          }
          if (label) {
            return `${label}: ${value}`;
          }
          return value;
        }
      }
    },
    plugins: {
      [VerticalLinePlugin.id]: {
        index: currentDateIndex
      },
      [PointDataLabelPlugin.id]: {
        index: currentDateIndex
      }
    }
  };
  return (
    <Export.ImageConsumer
      style={
        Object.assign(
          {height: '100%', position: 'relative', display: 'block'},
          style
        )
      }
      order={1}
    >
      <Chart
        error={error}
        data={dataConfiguration}
        loading={loading}
        type="summary"
        options={options}
        plugins={[
          PointDataLabelPlugin.plugin,
          VerticalLinePlugin.plugin
        ]}
      />
    </Export.ImageConsumer>
  );
}

export default observer(Summary);
export {Display};
