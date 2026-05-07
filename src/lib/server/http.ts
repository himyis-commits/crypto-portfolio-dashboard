export type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export class HttpError extends Error {
  status: number;
  url: string;
  body?: string;
  constructor(args: { status: number; url: string; message: string; body?: string }) {
    super(args.message);
    this.status = args.status;
    this.url = args.url;
    this.body = args.body;
  }
}

export async function fetchJson<T extends Json>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new HttpError({
      status: res.status,
      url: input,
      message: `HTTP ${res.status} for ${input}`,
      body
    });
  }
  return (await res.json()) as T;
}

