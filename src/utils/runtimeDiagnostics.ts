const seenMessages = new Set<string>();

function devLog(prefix: string, payload: unknown) {
  if (!__DEV__) {
    return;
  }

  const serialized = JSON.stringify(payload, null, 2);
  const message = `${prefix}:${serialized}`;
  if (seenMessages.has(message)) {
    return;
  }

  seenMessages.add(message);
  console.log(prefix, payload);
}

export function logDiagnosticsSnapshot(label: string, payload: Record<string, unknown>) {
  devLog(`[diag] ${label}`, payload);
}

export function logNonBoolean(label: string, value: unknown, extra?: Record<string, unknown>) {
  if (typeof value === 'boolean' || value === undefined || value === null) {
    return;
  }

  devLog(`[non-boolean] ${label}`, {
    value,
    type: typeof value,
    ...extra,
  });
}