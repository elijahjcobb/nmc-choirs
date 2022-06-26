// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import { google } from 'googleapis';
import { fetchDirectoryTree } from '../../data/drive';



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const x = await fetchDirectoryTree();
  res.status(200).json(x);
}
