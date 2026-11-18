export interface SheetDef {
  file: string;
  W: number;
  H: number;
  w: number;
  cols: number;
  rows: number;
  xs: { start: number; end: number }[];
  ys: { start: number; end: number }[];
}

export const BASE_CLOUDFRONT =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/';
export const INSET = 8;

export const SHEETS: Record<string, SheetDef> = {
  pre: {
    file: 'hf_20261111_212221_aa358f68-9766-4be1-a25b-4c2a7d766643.png',
    W: 1360,
    H: 2048,
    w: 1200,
    cols: 2,
    rows: 2,
    xs: [
      { start: 0, end: 673 },
      { start: 687, end: 1360 },
    ],
    ys: [
      { start: 0, end: 1015 },
      { start: 1029, end: 2048 },
    ],
  },
  ringa: {
    file: 'hf_20261111_212220_9be89454-e5c2-400f-a0c3-ed24fc218fbe.png',
    W: 2048,
    H: 2048,
    w: 1400,
    cols: 2,
    rows: 2,
    xs: [
      { start: 0, end: 1014 },
      { start: 1034, end: 2048 },
    ],
    ys: [
      { start: 0, end: 1016 },
      { start: 1032, end: 2048 },
    ],
  },
  ringb: {
    file: 'hf_20261111_212220_40759068-fc82-4598-8924-5f2e465e2e2e.png',
    W: 2048,
    H: 2048,
    w: 1400,
    cols: 2,
    rows: 2,
    xs: [
      { start: 0, end: 1016 },
      { start: 1032, end: 2048 },
    ],
    ys: [
      { start: 0, end: 1014 },
      { start: 1030, end: 2048 },
    ],
  },
  studio: {
    file: 'hf_20261111_212220_cd01507d-7e12-4101-b742-bc86e8f02f6a.png',
    W: 1360,
    H: 2048,
    w: 1360,
    cols: 2,
    rows: 2,
    xs: [
      { start: 0, end: 676 },
      { start: 685, end: 1360 },
    ],
    ys: [
      { start: 0, end: 1019 },
      { start: 1029, end: 2048 },
    ],
  },
  life: {
    file: 'hf_20261111_212221_aaa82e12-4ddb-46bd-9bd9-8e5189f0d06b.png',
    W: 1360,
    H: 2048,
    w: 1360,
    cols: 2,
    rows: 2,
    xs: [
      { start: 0, end: 676 },
      { start: 684, end: 1360 },
    ],
    ys: [
      { start: 0, end: 1019 },
      { start: 1029, end: 2048 },
    ],
  },
  base: {
    file: 'hf_20261111_212221_5918bfdd-271e-420d-87ac-6646f8992931.png',
    W: 2048,
    H: 1360,
    w: 2048,
    cols: 3,
    rows: 2,
    xs: [
      { start: 0, end: 676 },
      { start: 686, end: 1362 },
      { start: 1372, end: 2048 },
    ],
    ys: [
      { start: 0, end: 675 },
      { start: 685, end: 1360 },
    ],
  },
  styled: {
    file: 'hf_20261111_212221_99aed2e6-df64-4910-9867-29f8a8ae31c2.png',
    W: 2048,
    H: 1360,
    w: 2048,
    cols: 3,
    rows: 2,
    xs: [
      { start: 0, end: 676 },
      { start: 686, end: 1362 },
      { start: 1372, end: 2048 },
    ],
    ys: [
      { start: 0, end: 675 },
      { start: 685, end: 1360 },
    ],
  },
  styled2: {
    file: 'hf_20261111_212328_615deead-364f-4afb-82e6-ee7589e09dfb.png',
    W: 2048,
    H: 2048,
    w: 2048,
    cols: 2,
    rows: 2,
    xs: [
      { start: 0, end: 1016 },
      { start: 1032, end: 2048 },
    ],
    ys: [
      { start: 0, end: 1016 },
      { start: 1032, end: 2048 },
    ],
  },
  prod: {
    file: 'hf_20261111_212131_dac765cc-9d5d-4b23-b99c-9c838e37b5dc.png',
    W: 2048,
    H: 1360,
    w: 1600,
    cols: 1,
    rows: 1,
    xs: [{ start: 0, end: 2048 }],
    ys: [{ start: 0, end: 1360 }],
  },
  faces: {
    file: 'hf_20261111_212222_0554bb8d-aacd-4479-9b61-d1c200034665.png',
    W: 2048,
    H: 1360,
    w: 1600,
    cols: 3,
    rows: 2,
    xs: [
      { start: 0, end: 676 },
      { start: 686, end: 1362 },
      { start: 1372, end: 2048 },
    ],
    ys: [
      { start: 0, end: 675 },
      { start: 685, end: 1360 },
    ],
  },
};

export function getProxyUrl(sheet: SheetDef): string {
  const full = BASE_CLOUDFRONT + sheet.file;
  return `https://images.higgs.ai/?default=1&output=webp&url=${encodeURIComponent(full)}&w=${sheet.w}&q=85`;
}

export function parseImgKey(imgKey: string): { key: string; index: number } {
  const [k, nStr] = imgKey.split(':');
  return { key: k, index: parseInt(nStr, 10) || 0 };
}

export function computeCoverCropStyles(
  imgKey: string,
  elementWidth: number,
  elementHeight: number,
  fx: number = 0.5,
  fy: number = 0.5,
): React.CSSProperties | null {
  const { key, index } = parseImgKey(imgKey);
  const sheet = SHEETS[key];
  if (!sheet) return null;

  const col = index % sheet.cols;
  const row = Math.floor(index / sheet.cols);

  const x0 = (sheet.xs[col]?.start ?? 0) + INSET;
  const x1 = (sheet.xs[col]?.end ?? sheet.W) - INSET;
  const y0 = (sheet.ys[row]?.start ?? 0) + INSET;
  const y1 = (sheet.ys[row]?.end ?? sheet.H) - INSET;

  const cw = x1 - x0;
  const ch = y1 - y0;
  if (cw <= 0 || ch <= 0 || elementWidth <= 0 || elementHeight <= 0) return null;

  const scale = Math.max(elementWidth / cw, elementHeight / ch);
  const bw = sheet.W * scale;
  const bh = sheet.H * scale;
  const bx = -(x0 * scale + (cw * scale - elementWidth) * fx);
  const by = -(y0 * scale + (ch * scale - elementHeight) * fy);

  return {
    backgroundImage: `url("${getProxyUrl(sheet)}")`,
    backgroundSize: `${bw}px ${bh}px`,
    backgroundPosition: `${bx}px ${by}px`,
    backgroundRepeat: 'no-repeat',
  };
}

