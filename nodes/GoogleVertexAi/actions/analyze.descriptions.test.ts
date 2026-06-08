import * as image from './image/analyze.operation';
import * as document from './document/analyze.operation';
import * as audio from './audio/analyze.operation';
import * as transcribe from './audio/transcribe.operation';
import * as video from './video/analyze.operation';
import { analyzeExecute } from '../helpers/baseAnalyze';

describe('analyze/transcribe operation modules', () => {
  it('document/audio/video reuse the shared analyzeExecute', () => {
    for (const mod of [document, audio, transcribe, video]) {
      expect(mod.execute).toBe(analyzeExecute);
    }
  });
  it('image analyze has its own multi-image execute', () => {
    expect(image.execute).not.toBe(analyzeExecute);
    expect(typeof image.execute).toBe('function');
  });
  it('scope their prompt to the right resource/operation', () => {
    expect(image.description[0].displayOptions?.show).toEqual({ resource: ['image'], operation: ['analyze'] });
    expect(transcribe.description[0].displayOptions?.show).toEqual({ resource: ['audio'], operation: ['transcribe'] });
  });
  it('gives transcribe a sensible default prompt', () => {
    expect(transcribe.description[0].default).toMatch(/transcript/i);
  });
});
