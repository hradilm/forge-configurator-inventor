/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Design Automation team for Inventor
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////
// import { parse } from 'node-html-parser'; 
//const parse = require('node-html-parser');
//import React from 'react';
const React = require('react');
//import Enzyme, { shallow } from 'enzyme';
const Enzyme = require('enzyme');
//import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
const Adapter = require('@wojtekmaj/enzyme-adapter-react-17');
//import { ForgeView } from './forgeView';
const ForgeView = require('./forgeView');

Enzyme.configure({ adapter: new Adapter() });

const viewerDocumentMock = {
  getRoot: () => ({
    getDefaultGeometry: () => ''
  })
};

const loadDocumentNodeMock = jest.fn();
const viewerFinishMock = jest.fn();
const adskViewingShutdownMock = jest.fn();

class GuiViewer3DMock {
  addEventListener() {}
  loadDocumentNode() { loadDocumentNodeMock(); }
  start() {}
  finish() { viewerFinishMock(); }
}

const AutodeskMock = {
  Viewing: {
    GuiViewer3D: GuiViewer3DMock,
    Initializer: (_, handleViewerInit) => {
      handleViewerInit();
    },
    Document: {
      load: (_, onLoadSuccess) => {
        onLoadSuccess(viewerDocumentMock);
      }
    },
    shutdown: adskViewingShutdownMock
  }
};

describe('components', () => {
  describe('ForgeView', () => {

    beforeEach(() => {
      loadDocumentNodeMock.mockClear();
      viewerFinishMock.mockClear();
      adskViewingShutdownMock.mockClear();
    });

    it('load gets called when svf provided', () => {
      const baseProps = { activeProject: { svf: 'aaa111' } };
      const wrapper = shallow(<ForgeView { ...baseProps } />);

      const viewer = wrapper.find('.viewer');
      expect(viewer).toHaveLength(1);
      const script = viewer.find('Script');
      expect(script).toHaveLength(1);

      window.Autodesk = AutodeskMock;
      script.simulate('load');
      expect(loadDocumentNodeMock).toBeCalled();
    });

    it('load gets called when svf changes', () => {
      const baseProps = { activeProject: { svf: 'aaa111' } };
      const wrapper = shallow(<ForgeView { ...baseProps } />);

      window.Autodesk = AutodeskMock;
      const script = wrapper.find('Script');
      script.simulate('load');

      const updateProps = { activeProject: { svf: 'newurl' } };
      wrapper.setProps(updateProps);
      expect(loadDocumentNodeMock).toHaveBeenCalledTimes(2);
    });

    it('returns without loading when svf is null', () => {
      const baseProps = { activeProject: { svf: null } };
      const wrapper = shallow(<ForgeView { ...baseProps } />);

      window.Autodesk = AutodeskMock;
      const script = wrapper.find('Script');
      script.simulate('load');

      expect(loadDocumentNodeMock).toHaveBeenCalledTimes(0);
    });

    it('unmounts correctly', () => {
      const baseProps = { activeProject: { svf: 'aaa111' } };
      const wrapper = shallow(<ForgeView { ...baseProps } />);

      // preparation: must load the viewer first
      const viewer = wrapper.find('.viewer');
      expect(viewer).toHaveLength(1);
      const script = viewer.find('Script');
      expect(script).toHaveLength(1);
      window.Autodesk = AutodeskMock;
      script.simulate('load');

      wrapper.unmount();

      expect(viewerFinishMock).toHaveBeenCalled();
      expect(adskViewingShutdownMock).toHaveBeenCalled();
    });
  });
});