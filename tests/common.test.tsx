import * as React from 'react'
import { render } from '@testing-library/react'

import 'jest-canvas-mock'

import testIgc from '../demo/test_igc'
// import IgcViewer from "../src/components/App"
import { Igc3DViewer } from "../src"


describe('Common render', () => {
  it('renders without crashing', () => {
    render(
      <Igc3DViewer igc={testIgc} />
    );
  })
})

describe('Parses Launches', () => {
  it('Parses IGC Launches', () => {
    
  })
})
