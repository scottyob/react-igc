import React from 'react'
import ReactDOM from 'react-dom/client'
import testIgc from './test_igc'
// import IgcViewer from "../src/components/App"
import { Igc3DViewer } from "../src"

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
      // <IgcViewer igc={testIgc} />
root.render(
  <React.StrictMode>
    <Igc3DViewer igc={testIgc} />
  </React.StrictMode>,
)
