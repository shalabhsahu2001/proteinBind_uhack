import { NextResponse } from 'next/server';

const API_KEY = "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";
const invokeUrl = 'https://health.api.nvidia.com/v1/biology/nvidia/molmim/generate';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(invokeUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
