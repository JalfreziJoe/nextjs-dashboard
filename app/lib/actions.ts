'use server';

import { sql } from '@vercel/postgres';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { signIn } from '@/auth';

export const authenticate = async (prevState: string | undefined, formData: FormData) => {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a new customer'
  }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than £0' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status'
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// This is temporary until @types/react-dom is updated
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export const createInvoice = async (prevState: State, formData: FormData) => {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // check form data is valid, if not return wth errors
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to create invoice'
    };
  } 

  const { amount, customerId, status } = validatedFields.data
  const amountInDecimals = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInDecimals}, ${status}, ${date})  
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to create invoice',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
};

export const updateInvoice = async (id: string, prevState: State, formData: FormData) => {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // check form data is valid, if not return wth errors
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to update invoice'
    };
  } 

  const { amount, customerId, status } = validatedFields.data
  const amountInDecimals = amount * 100;

  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInDecimals}, status = ${status}
    WHERE id = ${id}
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to update invoice',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
};

export const deleteInvoice = async (id: string) => {
  throw new Error('Failed to delete invoice');

  try {
    await sql`
    DELETE FROM invoices WHERE id = ${id}
    `;
    revalidatePath('/dashboard/invoices');
    return {
      message: 'Deleted invoice'
    };
  } catch (error) {
    return {
      message: 'Database Error: Failed to delete invoice',
    };
  }

};
