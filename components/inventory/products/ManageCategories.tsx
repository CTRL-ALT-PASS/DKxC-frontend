import {
    createCategory,
    deleteCategory,
    updateCategory,
    type Category,
} from "@/services/categoriesApi";
import { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

const TERTIARY_SOFT = "#FDA4AF";

interface Props {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  /** Called after every successful create/update/delete so the parent can refetch. */
  onChanged: () => void | Promise<unknown>;
  /** Lets the parent reset a category filter that no longer exists. */
  onDeleted?: (categoryId: number) => void;
}

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

export default function ManageCategories({
  visible,
  categories,
  onClose,
  onChanged,
  onDeleted,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleClose = () => {
    setName("");
    setDescription("");
    setCreateError(null);
    onClose();
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setCreateError("Category name is required.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createCategory({
        category_name: trimmed,
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      setName("");
      setDescription("");
      await onChanged();
    } catch (e) {
      setCreateError(errorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 p-6">
        <Pressable
          className="absolute inset-0"
          onPress={handleClose}
          accessibilityLabel="Close"
        />

        <View
          className="w-full bg-white rounded-2xl overflow-hidden border border-tertiary-soft"
          style={{ maxWidth: 640, maxHeight: "90%" }}
        >
          {/* Header */}
          <View className="bg-neutral px-6 py-4 flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <View className="flex-row items-baseline">
                <Text className="text-secondary text-lg font-semibold">
                  Manage Categories
                </Text>
                <Text className="text-secondary/60 text-sm ml-3">
                  {categories.length} total
                </Text>
              </View>
              <Text className="text-secondary/70 text-sm mt-1">
                Add, rename or remove the categories on your POS menu.
              </Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Text className="text-secondary text-xl leading-6">✕</Text>
            </Pressable>
          </View>

          {/* Create */}
          <View className="px-6 pt-4 pb-3 border-b border-tertiary-soft/50">
            <Text className="text-secondary text-xs font-semibold mb-1">
              NEW CATEGORY
            </Text>
            <View className="flex-row items-center">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Seasonal Cold Brews"
                placeholderTextColor={TERTIARY_SOFT}
                maxLength={100}
                editable={!creating}
                onSubmitEditing={handleCreate}
                className="flex-1 border border-tertiary-soft rounded-lg px-3 py-2 text-secondary mr-3"
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description (optional)"
                placeholderTextColor={TERTIARY_SOFT}
                editable={!creating}
                onSubmitEditing={handleCreate}
                className="flex-1 border border-tertiary-soft rounded-lg px-3 py-2 text-secondary mr-3"
              />
              <Pressable
                onPress={handleCreate}
                disabled={creating}
                className={`bg-primary rounded-lg px-4 py-2 min-w-[130px] items-center ${
                  creating ? "opacity-60" : ""
                }`}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-medium">
                    Create category
                  </Text>
                )}
              </Pressable>
            </View>
            {createError && (
              <Text className="text-warn text-xs mt-2">{createError}</Text>
            )}
          </View>

          {/* List */}
          <ScrollView className="px-6" style={{ flexShrink: 1 }}>
            {categories.length === 0 ? (
              <Text className="text-secondary/60 text-center py-8">
                No categories yet
              </Text>
            ) : (
              categories.map((c) => (
                <CategoryRow
                  key={c.category_id}
                  category={c}
                  onChanged={onChanged}
                  onDeleted={onDeleted}
                />
              ))
            )}
          </ScrollView>

          {/* Footer */}
          <View className="px-6 py-4 border-t border-tertiary-soft/50 flex-row items-center justify-between">
            <Text className="text-secondary/60 text-xs flex-1 pr-4">
              Changes are saved immediately. A category with products can't be
              deleted.
            </Text>
            <Pressable
              onPress={handleClose}
              className="bg-primary rounded-lg px-6 py-2"
            >
              <Text className="text-white font-medium">Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */

function CategoryRow({
  category,
  onChanged,
  onDeleted,
}: {
  category: Category;
  onChanged: () => void | Promise<unknown>;
  onDeleted?: (categoryId: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.category_name);
  const [description, setDescription] = useState(category.description ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setName(category.category_name);
    setDescription(category.description ?? "");
    setError(null);
    setConfirmingDelete(false);
    setEditing(true);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Category name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateCategory(category.category_id, {
        category_name: trimmed,
        description: description.trim() ? description.trim() : null,
      });
      await onChanged();
      setEditing(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteCategory(category.category_id);
      onDeleted?.(category.category_id);
      await onChanged();
    } catch (e) {
      // 409 message from the API ends up here, e.g. "still used by other records"
      setError(errorMessage(e));
      setConfirmingDelete(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="py-3 border-b border-tertiary-soft/40">
      {editing ? (
        <>
          <View className="flex-row items-center">
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={100}
              editable={!busy}
              autoFocus
              placeholder="Category name"
              placeholderTextColor={TERTIARY_SOFT}
              className="flex-1 border border-tertiary-soft rounded-lg px-3 py-2 text-secondary mr-3"
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              editable={!busy}
              placeholder="Description"
              placeholderTextColor={TERTIARY_SOFT}
              className="flex-1 border border-tertiary-soft rounded-lg px-3 py-2 text-secondary mr-3"
            />
            <Pressable
              onPress={save}
              disabled={busy}
              className={`bg-primary rounded-lg px-4 py-2 mr-2 ${
                busy ? "opacity-60" : ""
              }`}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-medium">Save</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setEditing(false)}
              disabled={busy}
              className="border border-primary rounded-lg px-4 py-2"
            >
              <Text className="text-primary font-medium">Cancel</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View className="flex-row items-center">
          <View className="flex-1 pr-4">
            <Text className="text-secondary font-medium" numberOfLines={1}>
              {category.category_name}
            </Text>
            {!!category.description && (
              <Text className="text-secondary/60 text-sm" numberOfLines={1}>
                {category.description}
              </Text>
            )}
          </View>

          {confirmingDelete ? (
            <View className="flex-row items-center">
              <Text className="text-secondary text-sm mr-3">
                Delete this category?
              </Text>
              <Pressable
                onPress={remove}
                disabled={busy}
                className={`bg-warn rounded-lg px-3 py-1 mr-2 ${
                  busy ? "opacity-60" : ""
                }`}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-medium">Delete</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setConfirmingDelete(false)}
                disabled={busy}
                className="border border-tertiary-soft rounded-lg px-3 py-1"
              >
                <Text className="text-secondary">Keep</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center">
              <Pressable
                onPress={startEdit}
                className="border border-primary rounded-lg px-3 py-1 mr-2"
              >
                <Text className="text-primary font-medium">Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setError(null);
                  setConfirmingDelete(true);
                }}
                className="border border-warn rounded-lg px-3 py-1"
              >
                <Text className="text-warn font-medium">Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {error && <Text className="text-warn text-xs mt-2">{error}</Text>}
    </View>
  );
}
