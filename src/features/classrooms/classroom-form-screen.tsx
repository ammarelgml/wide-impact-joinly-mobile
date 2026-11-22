import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, type UseFormSetError } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import type { Classroom } from '@/api/client';
import { isApiError } from '@/api/errors';
import { formatStudentCount } from '@/lib/format';
import { errorMessage } from '@/api/messages';
import {
  Banner,
  Button,
  ConfirmDialog,
  ErrorState,
  Screen,
  SkeletonList,
  TextField,
  spacing,
} from '@/ui';

import { useClassroom, useCreateClassroom, useDeleteClassroom, useUpdateClassroom } from './api';
import {
  DESCRIPTION_MAX,
  NAME_MAX,
  classroomFormSchema,
  toClassroomBody,
  type ClassroomFormValues,
} from './classroom-form-schema';

/** Puts the API's field errors (400 VALIDATION_FAILED) on the matching inputs. Returns true if any matched. */
function applyServerFieldErrors(
  error: unknown,
  setError: UseFormSetError<ClassroomFormValues>,
): boolean {
  if (!isApiError(error, 'VALIDATION_FAILED')) return false;
  let matched = false;
  for (const field of error.fieldErrors) {
    if (field.path === 'name' || field.path === 'description') {
      setError(field.path, { message: field.message });
      matched = true;
    }
  }
  return matched;
}

function ClassroomForm({
  defaultValues,
  submitLabel,
  onSubmit,
  footerExtra,
}: {
  defaultValues: ClassroomFormValues;
  submitLabel: string;
  onSubmit: (values: ClassroomFormValues) => Promise<unknown>;
  footerExtra?: React.ReactNode;
}) {
  const [serverError, setServerError] = useState<unknown>(null);
  const { control, handleSubmit, setError, formState } = useForm<ClassroomFormValues>({
    resolver: zodResolver(classroomFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      if (!applyServerFieldErrors(error, setError)) setServerError(error);
    }
  });

  return (
    <Screen
      footer={
        <>
          <Button
            testID="classroom-save"
            label={submitLabel}
            loading={formState.isSubmitting}
            onPress={() => void submit()}
          />
          <Button
            label="Cancel"
            variant="secondary"
            disabled={formState.isSubmitting}
            onPress={() => router.back()}
          />
        </>
      }
    >
      <View style={styles.fields}>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField
              testID="classroom-name"
              label="Name"
              placeholder="e.g. Grade 6 Science"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              maxLength={NAME_MAX}
              showCounter
              autoFocus={!defaultValues.name}
              returnKeyType="next"
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <TextField
              testID="classroom-description"
              label="Description (optional)"
              placeholder="What students should know about this class"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              maxLength={DESCRIPTION_MAX}
              showCounter
              multiline
            />
          )}
        />
      </View>
      {serverError ? <Banner tone="error" message={errorMessage(serverError)} /> : null}
      {footerExtra}
    </Screen>
  );
}

/** T2, create mode. Saving opens the new classroom, which already has a join code. */
export function NewClassroomScreen() {
  const create = useCreateClassroom();
  return (
    <ClassroomForm
      defaultValues={{ name: '', description: '' }}
      submitLabel="Create classroom"
      onSubmit={async (values) => {
        const classroom = await create.mutateAsync(toClassroomBody(values));
        router.dismiss();
        router.push({ pathname: '/teacher/classrooms/[id]', params: { id: classroom.id } });
      }}
    />
  );
}

/** T2, edit mode, with Delete classroom at the bottom. */
export function EditClassroomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useClassroom(id);

  if (query.isPending) {
    return (
      <Screen>
        <SkeletonList count={2} />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen>
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }
  return <EditForm classroom={query.data} />;
}

function EditForm({ classroom }: { classroom: Classroom }) {
  const update = useUpdateClassroom(classroom.id);
  const remove = useDeleteClassroom(classroom.id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Leaving edit mode for a deleted classroom: go home, not back to a screen that no longer exists.
  useEffect(() => {
    if (remove.isSuccess) {
      router.dismissAll();
      router.replace('/teacher');
    }
  }, [remove.isSuccess]);

  return (
    <>
      <ClassroomForm
        defaultValues={{ name: classroom.name, description: classroom.description ?? '' }}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await update.mutateAsync(toClassroomBody(values));
          router.back();
        }}
        footerExtra={
          <View style={styles.danger}>
            <Button
              testID="classroom-delete"
              label="Delete classroom"
              variant="dangerGhost"
              icon="trash-outline"
              onPress={() => setConfirmDelete(true)}
            />
          </View>
        }
      />
      <ConfirmDialog
        visible={confirmDelete}
        title={`Delete "${classroom.name}"?`}
        message={
          classroom.studentCount > 0
            ? `This removes the classroom and its join code, and ${formatStudentCount(classroom.studentCount)} lose access. This can't be undone.`
            : "This removes the classroom and its join code. This can't be undone."
        }
        confirmLabel="Delete classroom"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await remove.mutateAsync();
          setConfirmDelete(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.lg },
  danger: { marginTop: 'auto', alignItems: 'center' },
});
