import React from "react"
import { Clock, Entity, Viewer, PointGraphics } from "resium";
import { Cartesian3, JulianDate, SampledPositionProperty, createWorldTerrain } from "cesium";
import IGCParser, { BRecord } from "igc-parser";

// Constant terrain world provider
const terrainProvider = createWorldTerrain()

// Helper function to convert IGC position to Cartesian
function toCartesian(fix: BRecord) {
  return Cartesian3.fromDegrees(fix.longitude, fix.latitude, fix.gpsAltitude || 0)
}


export type Props = {
  igc: string;
}

export default function Igc3DViewer(props: Props) {
  const flight = IGCParser.parse(props.igc);
  console.log(flight);

  const positionProperty = new SampledPositionProperty();
  flight.fixes.forEach((f) => {
    positionProperty.addSample(JulianDate.fromDate(new Date(f.timestamp)), toCartesian(f));
  })

  const entity = <Entity
    name={flight.pilot || "Pilot"}
    position={positionProperty}
    tracked
    selected
  >
    <PointGraphics pixelSize={10} />
  </Entity>;

  // Clock items
  const start = JulianDate.fromDate(new Date(flight.fixes[0].timestamp));
  const endTime = JulianDate.fromDate(new Date(flight.fixes[flight.fixes.length - 1].timestamp));

  return <Viewer
    style={{ height: "100%" }}
    terrainProvider={terrainProvider}
    timeline={false}
  >
    <Clock
      startTime={start}
      currentTime={start.clone()}
      stopTime={endTime}
      shouldAnimate
    />
    {entity}
  </Viewer>
  // return <div>Awww yeah</div>
}
