import { TRPCError } from '@trpc/server';

import { AppError } from '@documenso/lib/errors/app-error';
import { getFieldById } from '@documenso/lib/server-only/field/get-field-by-id';
import { removeSignedFieldWithToken } from '@documenso/lib/server-only/field/remove-signed-field-with-token';
import { setFieldsForDocument } from '@documenso/lib/server-only/field/set-fields-for-document';
import { setFieldsForTemplate } from '@documenso/lib/server-only/field/set-fields-for-template';
import { signFieldWithToken } from '@documenso/lib/server-only/field/sign-field-with-token';
import { updateField } from '@documenso/lib/server-only/field/update-field';
import { extractNextApiRequestMetadata } from '@documenso/lib/universal/extract-request-metadata';

import { authenticatedProcedure, procedure, router } from '../trpc';
import {
  ZAddFieldsMutationSchema,
  ZAddTemplateFieldsMutationSchema,
  ZGetFieldQuerySchema,
  ZRemovedSignedFieldWithTokenMutationSchema,
  ZSignFieldWithTokenMutationSchema,
  ZUpdateFieldMutationSchema,
} from './schema';

export const fieldRouter = router({
  addFields: authenticatedProcedure
    .input(ZAddFieldsMutationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { documentId, fields } = input;

        return await setFieldsForDocument({
          documentId,
          userId: ctx.user.id,
          fields: fields.map((field) => ({
            id: field.nativeId,
            signerEmail: field.signerEmail,
            type: field.type,
            pageNumber: field.pageNumber,
            pageX: field.pageX,
            pageY: field.pageY,
            pageWidth: field.pageWidth,
            pageHeight: field.pageHeight,
          })),
          requestMetadata: extractNextApiRequestMetadata(ctx.req),
        });
      } catch (err) {
        console.error(err);

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'We were unable to set this field. Please try again later.',
        });
      }
    }),

  addTemplateFields: authenticatedProcedure
    .input(ZAddTemplateFieldsMutationSchema)
    .mutation(async ({ input, ctx }) => {
      const { templateId, fields } = input;

      try {
        await setFieldsForTemplate({
          userId: ctx.user.id,
          templateId,
          fields: fields.map((field) => ({
            id: field.nativeId,
            signerEmail: field.signerEmail,
            type: field.type,
            pageNumber: field.pageNumber,
            pageX: field.pageX,
            pageY: field.pageY,
            pageWidth: field.pageWidth,
            pageHeight: field.pageHeight,
          })),
        });
      } catch (err) {
        console.error(err);

        throw err;
      }
    }),

  signFieldWithToken: procedure
    .input(ZSignFieldWithTokenMutationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { token, fieldId, value, isBase64, authOptions } = input;

        return await signFieldWithToken({
          token,
          fieldId,
          value,
          isBase64,
          userId: ctx.user?.id,
          authOptions,
          requestMetadata: extractNextApiRequestMetadata(ctx.req),
        });
      } catch (err) {
        console.error(err);

        throw AppError.parseErrorToTRPCError(err);
      }
    }),

  removeSignedFieldWithToken: procedure
    .input(ZRemovedSignedFieldWithTokenMutationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { token, fieldId } = input;

        return await removeSignedFieldWithToken({
          token,
          fieldId,
          requestMetadata: extractNextApiRequestMetadata(ctx.req),
        });
      } catch (err) {
        console.error(err);

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'We were unable to remove the signature for this field. Please try again later.',
        });
      }
    }),

  getField: authenticatedProcedure.input(ZGetFieldQuerySchema).query(async ({ input }) => {
    try {
      const { fieldId, documentId } = input;

      const field = await getFieldById({ fieldId, documentId });

      return field;
    } catch (err) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'We were unable to find this field. Please try again.',
      });
    }
  }),

  updateRadioField: authenticatedProcedure
    .input(ZUpdateFieldMutationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { documentId, fieldId, meta } = input;

        return await updateField({
          fieldId,
          documentId,
          userId: ctx.user.id,
          requestMetadata: extractNextApiRequestMetadata(ctx.req),
          fieldMeta: meta,
        });
      } catch (err) {
        console.error(err);

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'We were unable to set this field. Please try again later.',
        });
      }
    }),
});
