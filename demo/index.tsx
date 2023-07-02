import React from 'react'
import ReactDOM from 'react-dom/client'
import { igc1, waypointsXml } from './test_igc'
import { Igc3DViewer } from '../src'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Igc3DViewer igc={igc1} locationsXml={waypointsXml} />
  </React.StrictMode>,
)
