import React from "react";
import { View } from "react-native";

function MapView({ children, style }) {
  return React.createElement(View, { style }, children);
}

MapView.Marker = function Marker() {
  return null;
};

MapView.Callout = function Callout() {
  return null;
};

MapView.Polyline = function Polyline() {
  return null;
};

MapView.Circle = function Circle() {
  return null;
};

export default MapView;

export const Marker = MapView.Marker;
export const Callout = MapView.Callout;
export const Polyline = MapView.Polyline;
export const Circle = MapView.Circle;
export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = null;
