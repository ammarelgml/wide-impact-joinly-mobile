import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams, useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Controller, useForm, type UseFormSetError } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import type { Classroom } from '@/api/client';
import { isApiError } from '@/api/errors';
import { errorMessage } from '@/api/messages';
import {
  Banner,
  Button,
  ConfirmSheet,
  Divider,
  EmptyState,
  Loading,
  Screen,
  SkeletonBlock,
  TextField,
  space,
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

function saveErrorMessage(error: unknown): string {
  return isApiError(error, 'NETWORK') || isApiError(error, 'UNKNOWN')
    ? "Couldn't save the classroom. Your changes are still here — try again."
    : errorMessage(error);
}

type FormProps = {
  title: string;
  defaultValues: ClassroomFormValues;
  submitLabel: string;
  /** Saves, then returns the navigation to run once the form may close. */
  onSubmit: (values: ClassroomFormValues) => Promise<() => void>;
  extra?: ReactNode;
  /** Lifts the discard guard, e.g. once the classroom was deleted. */
  allowLeave?: boolean;
};

/**
 * T2: name and description, Save in a bottom bar that rides above the keyboard. Closing with
 * unsaved edits (close button, system back or swipe) asks "Discard your changes?" first.
 */
function ClassroomForm({
  title,
  defaultValues,
  submitLabel,
  onSubmit,
  extra,
  allowLeave = false,
}: FormProps) {
  const navigation = useNavigation();
  const [serverError, setServerError] = useState<unknown>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [exit, setExit] = useState<(() => void) | null>(null);
  const blocked = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const { control, handleSubmit, setError, formState } = useForm<ClassroomFormValues>({
    resolver: zodResolver(classroomFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const saving = formState.isSubmitting;
  usePreventRemove(formState.isDirty && !exit && !allowLeave, ({ data }) => {
    if (saving) return;
    blocked.current = data.action;
    setDiscardOpen(true);
  });

  // Runs after the guard is lifted: either the save's next screen, or the back the user asked for.
  useEffect(() => {
    exit?.();
  }, [exit]);

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const next = await onSubmit(values);
      setExit(() => next);
    } catch (error) {
      if (!applyServerFieldErrors(error, setError)) setServerError(error);
    }
  });

  return (
    <Screen
      appBar={{ title, leading: 'close', onLeading: () => router.back() }}
      footerBar
      footer={
        <Button
          testID="classroom-save"
          label={submitLabel}
          busy={saving}
          busyLabel="Saving…"
          onPress={() => void submit()}
        />
      }
      contentStyle={styles.content}
    >
      {serverError ? <Banner tone="error" message={saveErrorMessage(serverError)} /> : null}
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            testID="classroom-name"
            label="Class name"
            placeholder="e.g. Physics 101 — Section A"
            helper="Students see this name."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            maxLength={NAME_MAX}
            counter
            busy={saving}
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
            label="Description"
            optional
            placeholder="What students should know about this class"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            maxLength={DESCRIPTION_MAX}
            counter
            busy={saving}
            multiline
          />
        )}
      />
      {extra}
      <ConfirmSheet
        visible={discardOpen}
        title="Discard your changes?"
        message="The class name and description you typed won't be saved."
        confirmLabel="Discard"
        busyLabel="Discarding…"
        cancelLabel="Keep editing"
        onCancel={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false);
          const action = blocked.current;
          setExit(() => () => {
            if (action) navigation.dispatch(action);
          });
        }}
      />
    </Screen>
  );
}

/** T2, create mode. Saving opens the new classroom, which already has a join code. */
export function NewClassroomScreen() {
  const create = useCreateClassroom();
  return (
    <ClassroomForm
      title="New classroom"
      defaultValues={{ name: '', description: '' }}
      submitLabel="Save"
      onSubmit={async (values) => {
        const classroom = await create.mutateAsync(toClassroomBody(values));
        return () =>
          router.replace({ pathname: '/teacher/classrooms/[id]', params: { id: classroom.id } });
      }}
    />
  );
}

/** T2, edit mode, with Delete classroom at the bottom, away from Save. */
export function EditClassroomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useClassroom(id);

  if (query.isPending) {
    return (
      <Screen appBar={{ title: 'Edit classroom', leading: 'close' }}>
        <Loading gap={20}>
          <SkeletonBlock height={76} />
          <SkeletonBlock height={156} />
        </Loading>
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen
        appBar={{ title: 'Edit classroom', leading: 'close' }}
        center
        footer={<Button label="Retry" icon="refresh" onPress={() => void query.refetch()} />}
      >
        <EmptyState
          icon="cloud-offline-outline"
          tone="error"
          title="Couldn't load this classroom"
          message="Check your connection and try again."
        />
      </Screen>
    );
  }
  return <EditForm classroom={query.data} />;
}

function deleteMessage(classroom: Classroom): string {
  const n = classroom.studentCount;
  const who =
    n === 0
      ? `The invite code for ${classroom.name} stops working.`
      : n === 1
        ? `The 1 student in ${classroom.name} loses access, and the invite code stops working.`
        : `All ${n} students in ${classroom.name} lose access, and the invite code stops working.`;
  return `${who} This can't be undone.`;
}

function EditForm({ classroom }: { classroom: Classroom }) {
  const update = useUpdateClassroom(classroom.id);
  const remove = useDeleteClassroom(classroom.id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // A deleted classroom has no screen to go back to: return to the list.
  useEffect(() => {
    if (remove.isSuccess) router.dismissTo('/teacher');
  }, [remove.isSuccess]);

  return (
    <>
      <ClassroomForm
        title="Edit classroom"
        defaultValues={{ name: classroom.name, description: classroom.description ?? '' }}
        submitLabel="Save changes"
        allowLeave={remove.isSuccess}
        onSubmit={async (values) => {
          await update.mutateAsync(toClassroomBody(values));
          return () => router.back();
        }}
        extra={
          <View style={styles.danger}>
            <Divider />
            <Button
              testID="classroom-delete"
              label="Delete classroom"
              variant="dangerText"
              icon="trash-outline"
              onPress={() => setConfirmDelete(true)}
            />
          </View>
        }
      />
      <ConfirmSheet
        visible={confirmDelete}
        title="Delete this classroom?"
        message={deleteMessage(classroom)}
        confirmLabel="Delete classroom"
        busyLabel="Deleting…"
        errorText={(error) =>
          isApiError(error, 'NETWORK')
            ? "Couldn't delete the classroom. Check your connection and try again."
            : errorMessage(error)
        }
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
  content: { gap: 20, paddingTop: space[1] },
  danger: { gap: space[3], marginTop: space[2] },
});
