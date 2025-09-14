interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
}

export default function handler(_req: unknown, res: Res) {
  res.status(200).json({ ok: true });
}
