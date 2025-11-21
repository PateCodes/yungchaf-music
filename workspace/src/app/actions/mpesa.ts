'use server';

import axios from 'axios';
import { db, admin } from '@/lib/firebase-admin';

// In a real production app, these MUST be stored as environment variables.
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
// Ensure this is your deployed app's URL. For local dev, you might need ngrok.
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function getMpesaToken() {
  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
    console.error('M-Pesa consumer key or secret is not set.');
    throw new Error('M-Pesa credentials not configured.');
  }
  try {
    const auth = Buffer.from(
      `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
    ).toString('base64');
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );
    console.log('M-Pesa Token acquired successfully.');
    return response.data.access_token;
  } catch (error: any) {
    console.error('M-PESA TOKEN ERROR:', error.response?.data || error.message);
    throw new Error('Failed to acquire M-Pesa authentication token.');
  }
}

interface MpesaPaymentInput {
    phone: string;
    amount: number;
    fanId: string;
    currency: string;
    methodId: string;
}

export async function handleMpesaPayment(input: MpesaPaymentInput) {
  const { phone, amount, fanId, currency, methodId } = input;
  
  if (!fanId || !amount || !phone || !currency || !methodId) {
    return { success: false, error: 'Missing required contribution details.' };
  }

  // Log environment check
  console.log('M-PESA ENV CHECK:', {
    key: MPESA_CONSUMER_KEY ? 'OK' : 'MISSING',
    secret: MPESA_CONSUMER_SECRET ? 'OK' : 'MISSING',
    passkey: MPESA_PASSKEY ? 'OK' : 'MISSING',
    shortcode: MPESA_SHORTCODE,
    baseURL: NEXT_PUBLIC_BASE_URL,
  });
  
  if (!MPESA_PASSKEY || !MPESA_SHORTCODE || !NEXT_PUBLIC_BASE_URL) {
      const errorMsg = "Server configuration error: M-Pesa passkey, shortcode, or base URL is missing.";
      console.error(errorMsg);
      return { success: false, error: errorMsg };
  }

  try {
    const token = await getMpesaToken();

    // Create the contribution document in Firestore first.
    const contributionData = {
      fanId,
      amount: Number(amount),
      currency,
      method: 'mpesa',
      paymentMethod: methodId,
      status: 'pending' as const,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    const contributionRef = await db
      .collection('contributions')
      .add(contributionData);
    const contributionId = contributionRef.id;
    console.log(`Created contribution document with ID: ${contributionId}`);

    // Initiate STK Push.
    const now = new Date();
    const timestamp =
      now.getFullYear() +
      ('0' + (now.getMonth() + 1)).slice(-2) +
      ('0' + now.getDate()).slice(-2) +
      ('0' + now.getHours()).slice(-2) +
      ('0' + now.getMinutes()).slice(-2) +
      ('0' + now.getSeconds()).slice(-2);

    const password = Buffer.from(
      MPESA_SHORTCODE + MPESA_PASSKEY + timestamp
    ).toString('base64');

    const callBackURL = `${NEXT_PUBLIC_BASE_URL}/api/payments/mpesa-callback?contributionId=${contributionId}`;

    const stkRequestData = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount, // In sandbox, 1 is recommended for testing
      PartyA: phone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: callBackURL,
      AccountReference: 'YungChafMusic',
      TransactionDesc: 'Contribution to Yung Chaf Music',
    };

    console.log('STK PUSH REQUEST:', stkRequestData);

    const mpesaResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkRequestData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('STK PUSH SUCCESS:', mpesaResponse.data);

    return {
      success: true,
      message:
        'Check your phone to enter your M-Pesa PIN and complete the contribution.',
    };
  } catch (error: any) {
    console.error('STK PUSH ERROR:', error.response?.data || error.message);
    return {
      success: false,
      error: 'M-Pesa STK Push failed.',
      details: error.response?.data || error.message,
    };
  }
}
