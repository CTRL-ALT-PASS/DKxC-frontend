import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TextInputProps,
    View,
} from "react-native";
import {
    ApiError,
    createEmployee,
    Employee,
    EmploymentStatus,
    updateEmployee,
    UpdateEmployeePayload,
} from "../../../services/employeeApi";

interface Props {
  visible: boolean;
  /** null = add mode, an employee = edit mode */
  employee: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  phone_number: string;
  hire_date: string;
  employment_status: EmploymentStatus;
  pin_code: string;
}

const STATUSES: EmploymentStatus[] = ["Active", "Inactive", "Terminated"];

const EMPTY_FORM: FormState = {
  employee_id: "",
  first_name: "",
  last_name: "",
  position: "",
  phone_number: "",
  hire_date: "",
  employment_status: "Active",
  pin_code: "",
};

const fromEmployee = (e: Employee): FormState => ({
  employee_id: e.employee_id,
  first_name: e.first_name,
  last_name: e.last_name,
  position: e.position ?? "",
  phone_number: e.phone_number ?? "",
  hire_date: e.hire_date ? e.hire_date.slice(0, 10) : "",
  employment_status: e.employment_status ?? "Active",
  pin_code: "",
});

function Field({
  label,
  error,
  hint,
  ...input
}: { label: string; error?: string; hint?: string } & TextInputProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-xs font-semibold text-[#4B554E]">
        {label}
      </Text>
      <TextInput
        {...input}
        placeholderTextColor="#9AA19B"
        className={`h-11 rounded-xl border bg-[#FBFAF7] px-4 text-sm text-[#111A14] ${
          error ? "border-red-400" : "border-[#E4E7E4]"
        } ${input.editable === false ? "opacity-50" : ""}`}
      />
      {hint && !error ? (
        <Text className="mt-1 text-xs text-[#8A918A]">{hint}</Text>
      ) : null}
      {error ? (
        <Text className="mt-1 text-xs text-red-600">{error}</Text>
      ) : null}
    </View>
  );
}

export default function EmployeeFormModal({
  visible,
  employee,
  onClose,
  onSaved,
}: Props) {
  const isEdit = employee !== null;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(employee ? fromEmployee(employee) : EMPTY_FORM);
      setFieldErrors({});
      setFormError(null);
    }
  }, [visible, employee]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const err = (key: string) => fieldErrors[key]?.[0];

  const submit = async () => {
    setSaving(true);
    setFormError(null);
    setFieldErrors({});

    // Optional fields are omitted when empty: the backend's update rules
    // ("sometimes|string") reject null, so sending "" / null would fail.
    const optional: UpdateEmployeePayload = {};
    if (form.position.trim()) optional.position = form.position.trim();
    if (form.phone_number.trim())
      optional.phone_number = form.phone_number.trim();
    if (form.hire_date.trim()) optional.hire_date = form.hire_date.trim();

    try {
      if (isEdit && employee) {
        const payload: UpdateEmployeePayload = {
          ...optional,
          employment_status: form.employment_status,
        };
        if (form.first_name.trim()) payload.first_name = form.first_name.trim();
        if (form.last_name.trim()) payload.last_name = form.last_name.trim();
        if (form.pin_code) payload.pin_code = form.pin_code;
        await updateEmployee(employee.employee_id, payload);
      } else {
        await createEmployee({
          employee_id: form.employee_id.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          employment_status: form.employment_status,
          pin_code: form.pin_code,
          ...optional,
        });
      }
      onSaved();
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length > 0) {
        setFieldErrors(e.fieldErrors);
      } else {
        setFormError(e instanceof Error ? e.message : "Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/40 p-6">
        <View className="max-h-full w-full max-w-[560px] overflow-hidden rounded-2xl bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-[#E4E7E4] px-6 py-4">
            <Text className="text-lg font-bold text-[#111A14]">
              {isEdit ? "Update Employee" : "Add Employee"}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={20} color="#4B554E" />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView className="px-6 pt-5" keyboardShouldPersistTaps="handled">
            <Field
              label="Employee ID"
              value={form.employee_id}
              onChangeText={(v) => set("employee_id", v)}
              editable={!isEdit}
              maxLength={10}
              autoCapitalize="characters"
              placeholder="EMP-001"
              error={err("employee_id")}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field
                  label="First name"
                  value={form.first_name}
                  onChangeText={(v) => set("first_name", v)}
                  maxLength={50}
                  error={err("first_name")}
                />
              </View>
              <View className="flex-1">
                <Field
                  label="Last name"
                  value={form.last_name}
                  onChangeText={(v) => set("last_name", v)}
                  maxLength={50}
                  error={err("last_name")}
                />
              </View>
            </View>

            <Field
              label="Position"
              value={form.position}
              onChangeText={(v) => set("position", v)}
              error={err("position")}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field
                  label="Phone number"
                  value={form.phone_number}
                  onChangeText={(v) => set("phone_number", v)}
                  keyboardType="phone-pad"
                  maxLength={20}
                  error={err("phone_number")}
                />
              </View>
              <View className="flex-1">
                <Field
                  label="Hire date"
                  value={form.hire_date}
                  onChangeText={(v) => set("hire_date", v)}
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                  error={err("hire_date")}
                />
              </View>
            </View>

            {/* Status */}
            <View className="mb-4">
              <Text className="mb-1.5 text-xs font-semibold text-[#4B554E]">
                Status
              </Text>
              <View className="flex-row gap-2">
                {STATUSES.map((s) => {
                  const selected = form.employment_status === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => set("employment_status", s)}
                      className={`rounded-full border px-4 py-2 ${
                        selected
                          ? "border-[#1A3C2E] bg-[#1A3C2E]"
                          : "border-[#E4E7E4] bg-white"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selected ? "text-white" : "text-[#4B554E]"
                        }`}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {err("employment_status") ? (
                <Text className="mt-1 text-xs text-red-600">
                  {err("employment_status")}
                </Text>
              ) : null}
            </View>

            <Field
              label={isEdit ? "New PIN code" : "PIN code"}
              value={form.pin_code}
              onChangeText={(v) => set("pin_code", v)}
              secureTextEntry
              keyboardType="number-pad"
              placeholder={
                isEdit
                  ? "Leave blank to keep current PIN"
                  : "At least 5 characters"
              }
              hint="Minimum of 5 characters"
              error={err("pin_code")}
            />

            {formError ? (
              <Text className="mb-4 text-sm text-red-600">{formError}</Text>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View className="flex-row justify-end gap-3 border-t border-[#E4E7E4] bg-[#FBFAF7] px-6 py-4">
            <Pressable
              onPress={onClose}
              disabled={saving}
              className="rounded-xl border border-[#D9DDD9] bg-white px-5 py-3"
            >
              <Text className="text-sm font-semibold text-[#2B332E]">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={saving}
              className="min-w-[120px] flex-row items-center justify-center rounded-xl bg-[#1A3C2E] px-5 py-3 active:opacity-90"
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-sm font-semibold text-white">
                  {isEdit ? "Save changes" : "Add employee"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
