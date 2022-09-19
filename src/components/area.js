import ReactCharts from "echarts-for-react";
import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";

function AreaChart({ totalEvents, anomalousEvents }) {
  const areaRef = useRef();
  const AreaOptions = {
    tooltip: {
      trigger: "axis",
      position: function (pt) {
        return [pt[0], "10%"];
      },
    },
    grid: {
      left: 100,
      right: 50,
    },
    title: {
      textAlign: "left",
      textVerticalAlign: "auto",
      text: "Total Network Traffic Volume",
      textStyle: {
        color: "#ffffff",
        fontSize: "18px",
      },
      top: "5%",
      left: "2%",
    },
    color: ["#f73d0a", "#ffffff"],
    legend: {
      data: [
        {
          name: "Anomalous Traffic",
          icon: "square",
        },
        {
          name: "Network Traffic",
          icon: "square",
        },
      ],
      textStyle: {
        color: "#ffffff",
        fontSize: "14px",
      },
      bottom: "5%",
      left: "5%",
    },
    xAxis: {
      type: "time",
      name: "Time",
      nameLocation: "end",
      nameTextStyle: {
        color: "#ffffff",
        fontWeight: "bold",
        verticalAlign: "top",
        lineHeight: 30,
        fontSize: 14,
      },
      textStyle: {
        color: "#ffffff",
      },
      splitLine: { interval: 2 },
      axisLabel: { color: "#ffffff" },
      inverse: true,
    },
    yAxis: {
      type: "value",
      name: "Events",
      nameLocation: "middle",
      nameTextStyle: {
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: 14,
      },
      axisLabel: { color: "#ffffff", align: "right" },
      splitLine: { lineStyle: { opacity: 0.2 } },
      nameGap: 50,
    },
    series: [
      {
        name: "Anomalous Traffic",
        type: "line",
        symbol: "none",
        stack: true,
        lineStyle: {
          width: 0.7,
        },
        areaStyle: {
          opacity: 1,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1.5, [
            {
              offset: 0,
              color: "#f73d0a",
            },
            {
              offset: 1,
              color: "#000000",
            },
          ]),
        },
        data: [],
      },
      {
        name: "Network Traffic",
        type: "line",
        symbol: "none",
        stack: true,
        lineStyle: {
          width: 0.7,
          color: "#ffffff",
        },
        areaStyle: {
          opacity: 0.7,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1.5, [
            {
              offset: 0,
              color: "#ffffff",
            },
            {
              offset: 1,
              color: "#000000",
            },
          ]),
        },
        data: [],
      },
    ],
    notMerge: true,
    backgroundColor: "#0f0f0f",
  };

  useEffect(() => {
    console.log(totalEvents);
    if (areaRef.current !== null) {
      areaRef.current.getEchartsInstance().setOption({
        series: [
          {
            name: "Network Traffic",
            data: totalEvents,
          },
          {
            name: "Anomalous Traffic",
            data: anomalousEvents,
          },
        ],
      });
    }
  }, [totalEvents, anomalousEvents]);

  return (
    <ReactCharts
      ref={areaRef}
      style={{
        height: "100%",
        width: "100%",
      }}
      option={AreaOptions}
    />
  );
}

export default AreaChart;
