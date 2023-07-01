import React from 'react'
import { useRef, useEffect } from 'react'
import { Entity, Viewer, CesiumComponentRef, PointGraphics, WallGraphics } from 'resium'
import {
  Cartesian3,
  JulianDate,
  SampledPositionProperty,
  createWorldTerrain,
  Viewer as CesiumViewer,
  PolylineGlowMaterialProperty,
  Color,
  LinearApproximation,
  TimeIntervalCollection,
  TimeInterval,
  CallbackProperty,
} from 'cesium'
import IGCParser, { BRecord } from 'igc-parser'

// Constant terrain world provider
const terrainProvider = createWorldTerrain()

// Helper function to convert IGC position to Cartesian
function toCartesian(fix: BRecord) {
  return Cartesian3.fromDegrees(fix.longitude, fix.latitude, fix.gpsAltitude || 0)
}

export type Props = {
  igc: string
}

export default function Igc3DViewer(props: Props) {
  // A good example https://cesium.com/learn/cesiumjs-learn/cesiumjs-flight-tracker/
  // Lines to ground:  https://sandcastle.cesium.com/#c=tVhtcxo3EP4rN3w63KvABeMkdjwlNkkz4xBqcNqZ0vHId4LTRHe6kXRg2vF/7+pedS8Q0zZ8Qaz29dnVasUGC2tDyZYI660Vkq11TSSNA/QlodnLjpv8vuahwjQkYtnpXizDZbgBufeTyeJh8fnh02QxuQPxPhr0h68u0s3p+H7x8Xp8azKcvjr7qZCWCgs14zRUtzxcUxV7BFh+PH+NRqPB6PUw+5xdNNixyrmHAzQ6Hw5PR8WnwT1mBffoNHduLbBHSaiAOMhIAV6HRFH3hgriKspD7cxpP9t1eSyk1nF2nlE8CjZCV9PO0aAelaSZigzOa6DCCocDtBI8uCFrQYi0WzBwWiJ12uI5qeLfzfwioWeYdzFzx1EkOHb9GVb+pNy1K646BSZOEwoni98poi6LIAKtuRIJFv/4M9mqkFEUS79qz1BgCBsFeI0Ze8Tu15ngERFqZ6/iMM2L3bX+XobWno8gKhZh1a2LdvZnx1phJo1gVvSJeO8FDshC4FCuuAjKHBYkiQiWasqF8u+jBX9fCGUp8AkgGa41/AlsC55q+CWl2zmYDZzzHEZUuT6ISwax59IzTbTzLOWsflQ7uJmRhPuOM2Zn3jipVsfqG9AzHJKZoAHAtNGVnHYCJF0SEhTlGxJhz7Mz/Z+4R1hSxB+YWtl7MxELZr2xrGUHod4cBxEjN1jhXqDFZS9VNqYiWz3AEq3Z47Lj7FOYSH7CStAnUNzMiV8L3ExMvdYBNSdXMWGMRpJTD/32Yf5q6LQVQXe/VzSkgU7OE2Fz+hcB10bDNubnbok7rpxIOM+7Enuif9MM8z3oRpztGHRjMHbgJBQH6025dPazB1gRQTErwb3mjAt0N7k5ILWlnvJBZHCABwt3sYtIqXicEtD083SyR+65SX4uAdxCczgOskTipXD9D23oyFZUaUf/Ikkf7iaTKdpS5Y9Z5GMbruLuscBmN10sBABq3CEVNPJrzM4bkIwI8b5A/+Lim7zz2WRyo+eAfprJarch95EH4eksTjbgwi3cNbAjCsjthNOxFA1IAb7WC1ZnlVb2Iu9T+Wa8eaNLWs0QrYlK+gDDiQ/VnomMruTUdXUvSheNcaE5EuSb9TbVoi/VSFd2qfGqvJXTXaMsez1rSwAD4lmKQ0EmBiwJLSsNp+TcH1frDfhdu20RZ+JYZZKQEaMAVN+p0RkJ18rvXuyTa59AsgORLqqV3MwSYKZoxHbvdnMYq7Cwmyz304+Lh9+dtNAdU2MZ06FirZVeaTEZ/Q7WnmHL2W+jdKMFnhdIHVkIezUeXxTOgQrV/uW3Q9pTXBAVGK3YbsHf8TjULs4jn4jEp9xubadWtmf9fj+7tIum3zKRJaRKO0oGLfOsJizWFbyQjKZcGfKyWoTRiDQ5BqO+9UPBl+5nd0tZMD5S/A5SAXDZiWACSsX5Y6fRPKa2p9E0Dh6hNbeOsKlU7yT9PinkoU/lCnj54NKQUaMZnQBi0LSk0mW8xjrXxoaevJ3sri43TnqFVWh4/g7get0vCDS0lE+lHrsc68nCT7CO9IGS6RZJtKKCPyA43PqUkfzZB/xAk7GANqonXyvUs38ZDsqtt03/4EsTQO3fy3KZqWvJ5vd62pml/J+eMrUT8e0HjWH3yGeNVbxrcg1caK242lgP9K1fYz1ahS3ogS9V1UHSdAZzV+A0LMPPtCGZA4aWgIsXWnkb59DgLLhq14AuuTuexmKOIlWTCZsRhQGAU3O561i1GFPTpSvGuFIsT5r/6VSCrP7z0D535cogXZWMVWW/cQ2mzjqmkLNvzuvWT5khlB6pjtO5lGrHyFXeeX+mQQQHXD9hbXi9KgKvV4BV9h5j9ytRyJUyHx4ue6bopUc3FvXetvxrZrkMSwk7q5glD8Vl5+qyB/wNUcaTwvy8IYLhnWbzT69uUyJC6LIHP9slFefwVhE1zf8A
  // Perhaps Polyline will do ok?  https://sandcastle.cesium.com/?src=Sample%20Height%20from%203D%20Tiles.html
  // Hey this is a good reference:  https://replay.flights/
  
  // Idea:
  /*
  First pass:
    - Load in the tracks.
    - For each sample.
      - clampToHeighMostDetailed
    - Use this to be able to draw a polygon
  */


  // Parse the flight from the igc file
  const flight = IGCParser.parse(props.igc)

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

    // Enable depth testing
    viewer.scene.globe.depthTestAgainstTerrain = true;

    viewer.clock.startTime = start.clone()
    viewer.clock.stopTime = endTime.clone()
    viewer.clock.currentTime = start.clone()
    viewer.timeline.zoomTo(start, endTime)
    viewer.clock.shouldAnimate = true
    viewer.clock.multiplier = 10;
  }, [])


  // Calculate the line that should show below the pilot, roughly around their current time
  const positionsCallback = new CallbackProperty((time) => {
    const scene = ref.current?.cesiumElement?.scene;
    if(scene === undefined) {
      return [];
    }

    const start = flight.fixes[0].timestamp;
    const current = new Date(time.toString()).getTime();
    const finish = flight.fixes[flight.fixes.length - 1].timestamp;

    const totalDifference = finish - start;
    const currentDifference = current - start;
    const percentage = (currentDifference / totalDifference) * 100;

    const calculatedIndex = Math.round((percentage / 100) * (flight.fixes.length - 1));
    const recentFixes = flight.fixes.slice(calculatedIndex - 5, calculatedIndex + 1);

    const wallPoints = recentFixes.map(f => toCartesian(f)).filter(i => i != undefined);
    if(wallPoints.length < 1) {
      return [];
    }

    return wallPoints;
  }, false);

  return (
    <Viewer style={{ height: '100%' }} terrainProvider={terrainProvider} ref={ref}>
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
        <WallGraphics
          material={Color.GREEN.withAlpha(0.3)}
          positions={positionsCallback}
        />
      </Entity>
      ;
    </Viewer>
  )
}
