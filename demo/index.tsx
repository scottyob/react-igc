import React from 'react'
import ReactDOM from 'react-dom/client'
import { igc2, waypointsXml } from './test_igc'
import { Igc3DViewer } from '../src'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Igc3DViewer igc={igc2} locationsXml={waypointsXml} />
  </React.StrictMode>,
)
