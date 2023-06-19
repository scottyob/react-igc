import React from 'react'
import ReactDOM from 'react-dom/client'
import testIgc from './test_igc'
import IgcViewer from "../src/components/App"

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
      <IgcViewer igc={testIgc} />
  </React.StrictMode>,
)
