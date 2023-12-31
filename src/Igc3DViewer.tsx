import React from 'react'
import { useRef, useEffect } from 'react'
import {
  Entity,
  Viewer,
  CesiumComponentRef,
  PointGraphics,
  WallGraphics,
  CylinderGraphics,
  Label,
  LabelCollection,
  Scene,
  Globe,
} from 'resium'
import {
  Cartesian3,
  JulianDate,
  SampledPositionProperty,
  Viewer as CesiumViewer,
  PolylineGlowMaterialProperty,
  Color,
  LinearApproximation,
  TimeIntervalCollection,
  TimeInterval,
  CallbackProperty,
  HorizontalOrigin,
  VerticalOrigin,
  NearFarScalar,
  TimeIntervalCollectionProperty,
  ColorMaterialProperty,
  createWorldTerrainAsync,
  Ion,
} from 'cesium'
import IGCParser, { BRecord } from 'igc-parser'
import { GscWaypoints, type Waypoint } from './lib.js'
import { XMLParser } from 'fast-xml-parser'
import { getDistance } from 'geolib'

// Helper function to convert IGC position to Cartesian
function toCartesian(fix: BRecord) {
  return Cartesian3.fromDegrees(fix.longitude, fix.latitude, fix.gpsAltitude || 0)
}

export type Props = {
  igc: string
  locationsXml?: string
  cesiumToken?: string
}

// Calcualtes when waypoints were hit, given a recorded flight
function WaypointStartTimes(waypoints: Waypoint[], flight: IGCParser.IGCFile) {
  let currentWaypointIndex = 0
  let currentWaypoint = waypoints[currentWaypointIndex]

  const achievedTime: number[] = []
  flight.fixes.every((f) => {
    if (currentWaypoint == null) {
      return false
    }
    const distanceToWaypoint = getDistance(f, currentWaypoint)
    if (distanceToWaypoint < (currentWaypoint.radiusMeters || 0)) {
      achievedTime.push(f.timestamp)
      currentWaypointIndex++
      currentWaypoint = waypoints[currentWaypointIndex]
    }
    return true
  })
  return achievedTime
}

function Waypoints(props: { igc: string; locationsXml: string; flight: IGCParser.IGCFile }) {
  const waypoints = GscWaypoints(props.igc)
  const parser = new XMLParser()
  const jsonObj = parser.parse(props.locationsXml)

  const poi: Waypoint[] = jsonObj.kml.Document.Folder.Placemark.map((w: any) => {
    const [long, lat, alt] = w.Point.coordinates.split(',').map((s: any) => Number(s))
    return {
      longitude: long,
      latitude: lat,
      altitude: alt,
      name: w.name.toString(),
      description: w.description.toString(),
      radiusMeters: 10,
    }
  })

  for (let i = 0; i < waypoints.length; i++) {
    const name = waypoints[i].name.split(' ').slice(-1)[0]
    const poiWaypoint = poi.find((w) => w.name == name)
    if (poiWaypoint == null) {
      waypoints[i].altitude = 2000
      continue
    }

    waypoints[i].latitude = poiWaypoint.latitude
    waypoints[i].longitude = poiWaypoint.longitude
    waypoints[i].altitude = poiWaypoint.altitude
  }

  // Let's add an achieved time to the waypoints
  const achievedTimes = WaypointStartTimes(waypoints, props.flight)

  return (
    <>
      <LabelCollection>
        {poi.map((w, i) => (
          <Label
            key={i}
            text={w.name || w.name}
            scale={1}
            scaleByDistance={new NearFarScalar(1, 0, 1.2, 1)}
            horizontalOrigin={HorizontalOrigin.CENTER}
            verticalOrigin={VerticalOrigin.TOP}
            fillColor={Color.YELLOW}
            outlineColor={Color.BLACK}
            backgroundColor={Color.BLACK}
            outlineWidth={130}
            font='12px Helvetica'
            position={Cartesian3.fromDegrees(w.longitude, w.latitude, w.altitude + 250)}
          />
        ))}
      </LabelCollection>
      {poi.map((w, i) => (
        <Entity key={i} name={w.name} position={Cartesian3.fromDegrees(w.longitude, w.latitude, w.altitude)}>
          <PointGraphics color={Color.ORANGE} pixelSize={3} />
        </Entity>
      ))}

      {waypoints.map((w, i) => {
        // Render the cylinder column for the waypoint.

        // Check if the waypoint was ever achieved.  Changed the color when it's achieved
        const achievedTime = achievedTimes[i]
        const previousAchievedTime = achievedTimes[i - 1]

        const colorAtTime = new TimeIntervalCollectionProperty()
        colorAtTime.intervals.addInterval(
          new TimeInterval({
            start: JulianDate.fromIso8601('1980-08-01T00:00:00Z'),
            stop: JulianDate.fromDate(new Date(previousAchievedTime || 4070941261 * 1000)),
            isStopIncluded: true,
            isStartIncluded: true,
            data: Color.GRAY.withAlpha(0.15),
          }),
        )

        if (previousAchievedTime != null) {
          colorAtTime.intervals.addInterval(
            new TimeInterval({
              start: JulianDate.fromDate(new Date(previousAchievedTime)),
              stop: JulianDate.fromDate(new Date(achievedTime || 4070941261 * 1000)),
              isStartIncluded: true,
              isStopIncluded: true,
              data: Color.ORANGERED.withAlpha(0.12),
            }),
          )
        }

        if (achievedTime != null) {
          colorAtTime.intervals.addInterval(
            new TimeInterval({
              start: JulianDate.fromDate(new Date(achievedTime)),
              stop: JulianDate.fromIso8601('2033-08-01T00:00:00Z'),
              isStartIncluded: true,
              isStopIncluded: true,
              data: Color.GREEN.withAlpha(0),
            }),
          )
        }

        return (
          <Entity
            key={'w-' + i.toString()}
            name={w.description || w.name}
            position={Cartesian3.fromDegrees(w.longitude, w.latitude, w.altitude)}
          >
            <CylinderGraphics
              topRadius={w.radiusMeters}
              bottomRadius={w.radiusMeters}
              length={1200}
              material={new ColorMaterialProperty(colorAtTime)}
            />
          </Entity>
        )
      })}
    </>
  )
}

export default function Igc3DViewer(props: Props) {
  // Hey this is a good reference:  https://replay.flights/
  // Inspiration!

  // Parse the flight from the igc file
  const flight = IGCParser.parse(props.igc)

  // Set the world terrain
  if (props.cesiumToken) {
    Ion.defaultAccessToken = props.cesiumToken
  }

  // Load up the XML locations
  let waypoints = undefined
  if (props.locationsXml != null) {
    waypoints = <Waypoints igc={props.igc} locationsXml={props.locationsXml} flight={flight} />
  }

  // Setup the track log for the entity
  const positionProperty = new SampledPositionProperty()
  flight.fixes.forEach((f) => {
    positionProperty.addSample(JulianDate.fromDate(new Date(f.timestamp)), toCartesian(f))
  })
  positionProperty.setInterpolationOptions({
    interpolationDegree: 1,
    interpolationAlgorithm: LinearApproximation,
  })

  // Clock items
  const start = JulianDate.fromDate(new Date(flight.fixes[0].timestamp))
  const endTime = JulianDate.fromDate(new Date(flight.fixes[flight.fixes.length - 1].timestamp))

  // Hook the start-time and end-time zoom
  const ref = useRef<CesiumComponentRef<CesiumViewer>>(null)

  useEffect(() => {
    const viewer = ref.current?.cesiumElement
    if (viewer === undefined) {
      return
    }

    viewer.clock.startTime = start.clone()
    viewer.clock.stopTime = endTime.clone()
    viewer.clock.currentTime = start.clone()
    viewer.timeline.zoomTo(start, endTime)
    viewer.clock.shouldAnimate = true
    viewer.clock.multiplier = 10

    createWorldTerrainAsync()
      .then((t) => {
        viewer.terrainProvider = t
      })
      .catch(
        // No idea why it throws an error here
        (err) => {
          console.log("Wut");
          console.debug('yeah, Error when setting terrain provider.. Seems to work anyway: ', err);
        },
      )
  }, [start, endTime])

  // Calculate the line that should show below the pilot, roughly around their current time
  const positionsCallback = new CallbackProperty((time) => {
    const scene = ref.current?.cesiumElement?.scene
    if (scene === undefined) {
      return []
    }

    const start = flight.fixes[0].timestamp
    const current = new Date(time.toString()).getTime()
    const finish = flight.fixes[flight.fixes.length - 1].timestamp

    const totalDifference = finish - start
    const currentDifference = current - start
    const percentage = (currentDifference / totalDifference) * 100

    const calculatedIndex = Math.round((percentage / 100) * (flight.fixes.length - 1))
    const recentFixes = flight.fixes.slice(calculatedIndex - 5, calculatedIndex + 1)

    const wallPoints = recentFixes.map((f) => toCartesian(f)).filter((i) => i != undefined)
    if (wallPoints.length < 1) {
      return []
    }

    return wallPoints
  }, false)

  return (
    <Viewer style={{ height: '100%' }} ref={ref}>
      <Scene />
      <Globe depthTestAgainstTerrain={true} />
      {waypoints && waypoints}
      <Entity
        name={flight.pilot || 'Pilot'}
        position={positionProperty}
        path={{
          resolution: 1,
          width: 1,
          trailTime: 120,
          leadTime: 0,
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.1,
            color: Color.WHEAT,
          }),
        }}
        availability={
          new TimeIntervalCollection([
            new TimeInterval({
              start: start,
              stop: endTime,
            }),
          ])
        }
        selected
        tracked
      >
        <PointGraphics />
      </Entity>
      <Entity>
        <WallGraphics material={Color.GREEN.withAlpha(0.3)} positions={positionsCallback} />
      </Entity>
    </Viewer>
  )
}
