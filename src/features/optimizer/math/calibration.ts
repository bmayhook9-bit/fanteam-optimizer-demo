import { promises as fs } from 'fs';
import path from 'path';
import { Projection } from './conversion';

export interface CalibrationFactors {
  mean: number;
  floor: number;
  ceiling: number;
}

const CALIBRATION_PATH = path.join(__dirname, 'calibration.json');

export async function loadCalibration(): Promise<CalibrationFactors> {
  const json = await fs.readFile(CALIBRATION_PATH, 'utf-8');
  return JSON.parse(json) as CalibrationFactors;
}

export function calibrateProjection(
  proj: Projection,
  factors: CalibrationFactors,
): Projection {
  return {
    mean: proj.mean * factors.mean,
    floor: proj.floor * factors.floor,
    ceiling: proj.ceiling * factors.ceiling,
  };
}
