import type { Dataset } from '../models/dataset';
import type { PreviewResponse, PreviewToken } from '../models/normalization-preview';
import { computeNormalizationPreview, readPreviewPage, type PreviewSnapshot } from './normalization-preview';
import { errorToken, previewRequest } from './normalization-preview-validation';

interface Source { original: Dataset; mapping: Record<string, string>; session: number }
let source: Source | undefined;
let validSource: Source | undefined;
let snapshot: { token: PreviewToken; value: PreviewSnapshot } | undefined;
let generation = -1;
let ticket = 0;
// Task scheduling (not Promise.resolve): permits message delivery between bounded compute batches.
const yieldTask = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const reply = (response: PreviewResponse) => postMessage(response);

addEventListener('message', async ({ data }: MessageEvent<unknown>) => {
  const token = errorToken(data);
  let ownTicket: number | undefined;
  try {
    const request = previewRequest(data);
    if (request.kind === 'preview-page') {
      if (!snapshot || source?.session !== request.session || snapshot.token.session !== request.session || snapshot.token.generation !== request.generation) throw new Error('La sesión o generación de vista previa no está disponible.');
      reply({ ...token, kind: 'preview-page', ...readPreviewPage(snapshot.value, request.window) });
      return;
    }
    if (request.kind === 'preview-cancel') {
      if (!source || source.session !== request.session || generation !== request.generation) throw new Error('La sesión o generación de vista previa no está disponible.');
      ++ticket;
      reply({ ...token, kind: 'preview-cancelled' });
      return;
    }
    if (request.kind === 'preview-init') {
      if (source && request.session <= source.session) throw new Error('Inicie una sesión de vista previa nueva.');
    } else if (!source || source.session !== request.session || request.generation <= generation) {
      throw new Error('La sesión o generación de vista previa no está disponible.');
    }
    const candidate = request.kind === 'preview-init' ? { original: request.original, mapping: request.mapping, session: request.session } : source!;
    if (request.window.offset > candidate.original.rows.length || request.window.columnIndices.some(c => c >= candidate.original.headers.length)) throw new Error('Ventana de vista previa inválida.');
    // postMessage has cloned the init payload once; retain that worker-owned original for every update.
    source = candidate;
    generation = request.generation;
    ownTicket = ++ticket;
    const compute = computeNormalizationPreview(candidate.original, candidate.mapping, request.options);
    let step = compute.next();
    while (!step.done) {
      await yieldTask();
      if (ownTicket !== ticket) return;
      step = compute.next();
    }
    if (ownTicket !== ticket) return;
    const page = readPreviewPage(step.value, request.window);
    snapshot = { token, value: step.value };
    validSource = source;
    reply({ ...token, kind: 'preview-ready', metadata: step.value.metadata, ...page });
  } catch (error) {
    if (ownTicket !== undefined && ownTicket !== ticket) return;
    if (ownTicket !== undefined) {
      source = validSource;
      generation = snapshot?.token.generation ?? -1;
    }
    reply({ ...token, kind: 'preview-error', message: error instanceof Error ? error.message : 'No se pudo completar la vista previa local.' });
  }
});
