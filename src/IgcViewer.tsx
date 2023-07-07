import React from 'react'
import IGCParser from 'igc-parser'
import { MapContainer, Polyline, TileLayer, MapContainerProps } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type Props = MapContainerProps & {
  igc: string
}

export default function IgcViewer(props: Props) {
  const igc = props.igc;
  const flight = IGCParser.parse(igc)

  // const task = flight.task;
  const position = { lat: flight.fixes[0].latitude, lng: flight.fixes[0].longitude }
  const positions = flight.fixes.map((p) => {
    return {
      lat: p.latitude,
      lng: p.longitude,
    }
  })

  return (
    <MapContainer
      style={{ display: 'flex', flexGrow: 1 }}
      center={position}
      {...props}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <Polyline positions={positions} />
    </MapContainer>
  )
}
